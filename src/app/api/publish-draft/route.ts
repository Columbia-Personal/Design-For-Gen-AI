import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before publishing a draft." }, { status: 401 });

  const body = await request.json().catch(() => null) as { draftId?: unknown } | null;
  const draftId = typeof body?.draftId === "string" ? body.draftId : "";
  if (!draftId) return NextResponse.json({ error: "This draft could not be found." }, { status: 400 });

  const { data: draft, error: draftError } = await supabase
    .from("caption_drafts")
    .select("id, text, prompt, generation_model, media_source, media_url, media_path, media_alt, challenge_id")
    .eq("id", draftId)
    .maybeSingle();
  if (draftError || !draft) return NextResponse.json({ error: "This draft is no longer available." }, { status: 404 });

  let mediaUrl = draft.media_url;
  let publicPath: string | null = null;
  if (draft.media_source === "upload") {
    if (!draft.media_path) return NextResponse.json({ error: "This draft image is missing. Try creating it again." }, { status: 400 });
    const { data: image, error: downloadError } = await supabase.storage.from("caption-drafts").download(draft.media_path);
    if (downloadError || !image) return NextResponse.json({ error: "This draft image could not be prepared for publishing." }, { status: 500 });
    publicPath = `${user.id}/${crypto.randomUUID()}.${extensionFor(image.type)}`;
    const { error: uploadError } = await supabase.storage
      .from("caption-media")
      .upload(publicPath, image, { contentType: image.type || "image/jpeg", upsert: false });
    if (uploadError) return NextResponse.json({ error: "Your image could not be published. Try again." }, { status: 500 });
    mediaUrl = supabase.storage.from("caption-media").getPublicUrl(publicPath).data.publicUrl;
  }

  if (!mediaUrl) return NextResponse.json({ error: "This draft does not have media to publish." }, { status: 400 });
  const { data: caption, error: captionError } = await supabase
    .from("captions")
    .insert({
      text: draft.text,
      prompt: draft.prompt,
      author_id: user.id,
      generation_model: draft.generation_model || GEMINI_MODEL,
      media_key: draft.media_source === "starter-gif" ? "reaction-gif" : "user-upload",
      media_url: mediaUrl,
      media_alt: draft.media_alt,
      challenge_id: draft.challenge_id,
    })
    .select("id")
    .single();

  if (captionError || !caption) {
    if (publicPath) await supabase.storage.from("caption-media").remove([publicPath]);
    return NextResponse.json({ error: "Your caption could not be published. Try again." }, { status: 500 });
  }

  if (draft.media_path) await supabase.storage.from("caption-drafts").remove([draft.media_path]);
  await supabase.from("caption_drafts").delete().eq("id", draft.id);
  return NextResponse.json({ caption });
}
