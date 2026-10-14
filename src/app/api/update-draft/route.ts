import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_CAPTION_LENGTH = 220;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before updating a draft." }, { status: 401 });

  const body = await request.json().catch(() => null) as { draftId?: unknown; caption?: unknown } | null;
  const draftId = typeof body?.draftId === "string" ? body.draftId : "";
  const caption = typeof body?.caption === "string" ? body.caption.trim() : "";
  if (!draftId || !caption || caption.length > MAX_CAPTION_LENGTH) {
    return NextResponse.json({ error: "Keep the caption between 1 and 220 characters." }, { status: 400 });
  }

  const { data: draft, error } = await supabase
    .from("caption_drafts")
    .update({ text: caption, updated_at: new Date().toISOString() })
    .eq("id", draftId)
    .select("id, text, prompt, media_source, media_url, media_path, media_alt, created_at")
    .maybeSingle();
  if (error || !draft) return NextResponse.json({ error: "This draft could not be updated. Try again." }, { status: 500 });

  let mediaUrl = draft.media_url;
  if (draft.media_path) {
    const signedMedia = await supabase.storage.from("caption-drafts").createSignedUrl(draft.media_path, 60 * 60);
    mediaUrl = signedMedia.data?.signedUrl ?? null;
  }
  return NextResponse.json({ draft: { ...draft, media_url: mediaUrl } });
}
