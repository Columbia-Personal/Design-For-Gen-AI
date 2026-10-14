import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before discarding a draft." }, { status: 401 });

  const body = await request.json().catch(() => null) as { draftId?: unknown } | null;
  const draftId = typeof body?.draftId === "string" ? body.draftId : "";
  if (!draftId) return NextResponse.json({ error: "This draft could not be found." }, { status: 400 });

  const { data: draft } = await supabase
    .from("caption_drafts")
    .select("id, media_path")
    .eq("id", draftId)
    .maybeSingle();
  if (!draft) return NextResponse.json({ error: "This draft is no longer available." }, { status: 404 });

  if (draft.media_path) await supabase.storage.from("caption-drafts").remove([draft.media_path]);
  const { error } = await supabase.from("caption_drafts").delete().eq("id", draft.id);
  if (error) return NextResponse.json({ error: "Your draft could not be discarded. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
