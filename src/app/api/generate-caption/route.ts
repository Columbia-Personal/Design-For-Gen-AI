import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_PROMPT_LENGTH = 280;
const MAX_CAPTION_LENGTH = 220;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

function cleanCaption(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[\"“]|[\"”]$/g, "").trim().slice(0, MAX_CAPTION_LENGTH);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before generating a caption." }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "The image could not be read. Try selecting it again." }, { status: 400 });

  const image = formData.get("image");
  const prompt = getString(formData, "prompt");
  const detour = getString(formData, "detour");
  if (!(image instanceof File)) return NextResponse.json({ error: "Add a JPG, PNG, or WebP image first." }, { status: 400 });
  if (!ACCEPTED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image that is 4 MB or smaller." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: `Keep the extra context under ${MAX_PROMPT_LENGTH} characters.` }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Caption generation is not configured yet. Add GEMINI_API_KEY and try again." }, { status: 503 });

  try {
    const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
    const context = [detour ? `Daily prompt: ${detour}` : "", prompt ? `Extra context from the uploader: ${prompt}` : ""].filter(Boolean).join("\n");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: [
                "Look at this image and write exactly one original caption for a student-run New York humor feed.",
                "Keep it under 180 characters. Make it dry, specific, and casually online.",
                "Return only the caption: no hashtags, quotation marks, setup, or explanation.",
                context || "Use visual details from the image.",
              ].join("\n") },
              { inlineData: { mimeType: image.type, data: imageData } },
            ],
          }],
          generationConfig: { maxOutputTokens: 100 },
        }),
      },
    );

    if (!response.ok) return NextResponse.json({ error: "The caption model is taking a break. Try again in a moment." }, { status: 502 });
    const result = (await response.json()) as GeminiResponse;
    const caption = cleanCaption(result.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    if (!caption) return NextResponse.json({ error: "The model did not return a caption. Try another image." }, { status: 502 });
    return NextResponse.json({ caption, generationModel: GEMINI_MODEL });
  } catch {
    return NextResponse.json({ error: "The request did not finish. Check your connection and try again." }, { status: 500 });
  }
}
