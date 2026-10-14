import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_PROMPT_LENGTH = 280;
const MAX_CAPTION_LENGTH = 220;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
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
  if (!user) return NextResponse.json({ error: "Sign in before publishing a caption." }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "The post could not be read. Try again." }, { status: 400 });

  const image = formData.get("image");
  const text = getString(formData, "caption");
  const prompt = getString(formData, "prompt");
  const mediaAlt = getString(formData, "mediaAlt");
  if (!(image instanceof File)) return NextResponse.json({ error: "Add an image before publishing." }, { status: 400 });
  if (!ACCEPTED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image that is 4 MB or smaller." }, { status: 400 });
  }
  if (!text || text.length > MAX_CAPTION_LENGTH) {
    return NextResponse.json({ error: "The caption needs to be between 1 and 220 characters." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH || mediaAlt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: "Keep the supporting text under 280 characters." }, { status: 400 });
  }

  const path = `${user.id}/${crypto.randomUUID()}.${getExtension(image)}`;
  const { error: uploadError } = await supabase.storage.from("caption-media").upload(path, image, { contentType: image.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Your image could not be uploaded. Try again." }, { status: 500 });

  const { data: publicUrl } = supabase.storage.from("caption-media").getPublicUrl(path);
  const { data: caption, error: captionError } = await supabase
    .from("captions")
    .insert({
      text,
      prompt: prompt || null,
      author_id: user.id,
      generation_model: GEMINI_MODEL,
      media_key: "user-upload",
      media_url: publicUrl.publicUrl,
      media_alt: mediaAlt || "Image uploaded for a Caption Lab post.",
    })
    .select("id")
    .single();

  if (captionError || !caption) {
    await supabase.storage.from("caption-media").remove([path]);
    return NextResponse.json({ error: "Your caption could not be published. Try again." }, { status: 500 });
  }
  return NextResponse.json({ caption });
}
