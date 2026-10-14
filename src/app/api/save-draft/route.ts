import { NextResponse } from "next/server";
import { getStarterGif } from "@/lib/starter-gifs";
import { createClient } from "@/lib/supabase/server";

const MAX_PROMPT_LENGTH = 280;
const MAX_CAPTION_LENGTH = 220;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getExtension(image: File) {
  if (image.type === "image/png") return "png";
  if (image.type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before saving a draft." }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "The draft could not be read. Try again." }, { status: 400 });

  const image = formData.get("image");
  const starterGif = getStarterGif(getString(formData, "starterGifId"));
  const text = getString(formData, "caption");
  const prompt = getString(formData, "prompt");
  const challengeId = Number(getString(formData, "challengeId"));

  if (!text || text.length > MAX_CAPTION_LENGTH) return NextResponse.json({ error: "The caption needs to be between 1 and 220 characters." }, { status: 400 });
  if (prompt.length > MAX_PROMPT_LENGTH) return NextResponse.json({ error: "Keep the supporting context under 280 characters." }, { status: 400 });
  if (!(image instanceof File) && !starterGif) return NextResponse.json({ error: "Choose a starter GIF or add an image before saving." }, { status: 400 });
  if (image instanceof File && (!ACCEPTED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image that is 4 MB or smaller." }, { status: 400 });
  }

  let mediaPath: string | null = null;
  if (image instanceof File) {
    mediaPath = `${user.id}/${crypto.randomUUID()}.${getExtension(image)}`;
    const { error: uploadError } = await supabase.storage
      .from("caption-drafts")
      .upload(mediaPath, image, { contentType: image.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: "Your draft image could not be saved. Try again." }, { status: 500 });
  }

  const { data: draft, error: draftError } = await supabase
    .from("caption_drafts")
    .insert({
      author_id: user.id,
      text,
      prompt: prompt || null,
      generation_model: "gemini-3.5-flash-lite",
      media_source: starterGif ? "starter-gif" : "upload",
      media_url: starterGif?.url ?? null,
      media_path: mediaPath,
      media_alt: starterGif?.alt || prompt || "Image uploaded for a private Caption Lab draft.",
      challenge_id: Number.isSafeInteger(challengeId) && challengeId > 0 ? challengeId : null,
    })
    .select("id")
    .single();

  if (draftError || !draft) {
    if (mediaPath) await supabase.storage.from("caption-drafts").remove([mediaPath]);
    return NextResponse.json({ error: "Your draft could not be saved. Try again." }, { status: 500 });
  }
  return NextResponse.json({ draft });
}
