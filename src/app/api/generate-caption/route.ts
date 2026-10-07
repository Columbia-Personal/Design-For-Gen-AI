import { NextResponse } from "next/server";
import { getSceneMedia } from "@/lib/scene-media";
import { createClient } from "@/lib/supabase/server";

const MAX_PROMPT_LENGTH = 280;
const MAX_CAPTION_LENGTH = 220;
const GEMINI_MODEL = "gemini-3.5-flash-lite";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function cleanCaption(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\"“]|[\"”]$/g, "")
    .trim()
    .slice(0, MAX_CAPTION_LENGTH);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before generating a caption." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    prompt?: unknown;
    mediaKey?: unknown;
  } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const mediaKey = typeof body?.mediaKey === "string" ? body.mediaKey : "";
  const selectedMedia = getSceneMedia(mediaKey);

  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Describe the scene in 1–${MAX_PROMPT_LENGTH} characters.` },
      { status: 400 },
    );
  }

  if (!selectedMedia) {
    return NextResponse.json(
      { error: "Choose a visual before generating a caption." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Caption generation is not configured yet. Add GEMINI_API_KEY and try again." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    "Write exactly one original caption for a student-run New York humor feed.",
                    "Keep it under 180 characters. Make it dry, specific, and casually online.",
                    "Return only the caption: no hashtags, quotation marks, setup, or explanation.",
                    `Scene: ${prompt}`,
                  ].join("\n"),
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "The caption model is taking a break. Try again in a moment." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as GeminiResponse;
    const generated = cleanCaption(result.candidates?.[0]?.content?.parts?.[0]?.text ?? "");

    if (!generated) {
      return NextResponse.json(
        { error: "The model did not return a caption. Try a different scene." },
        { status: 502 },
      );
    }

    const { data: caption, error } = await supabase
      .from("captions")
      .insert({
        text: generated,
        prompt,
        author_id: user.id,
        generation_model: GEMINI_MODEL,
        media_key: selectedMedia.key,
        media_url: selectedMedia.imageUrl,
      })
      .select("id, text, prompt, author_id, generation_model, media_key, media_url, created_at")
      .single();

    if (error || !caption) {
      return NextResponse.json(
        { error: "The caption was created but could not be saved. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ caption });
  } catch {
    return NextResponse.json(
      { error: "The request did not finish. Check your connection and try again." },
      { status: 500 },
    );
  }
}
