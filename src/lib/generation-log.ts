import type { SupabaseClient } from "@supabase/supabase-js";

// Logging must never prevent the user from generating a caption. It records
// text only, never image bytes or provider credentials.
export async function startGenerationLog(client: SupabaseClient, userId: string, model: string, prompt: string) {
  try {
    const { data, error } = await client.from("generation_requests").insert({ user_id: userId, model, prompt, status: "started" }).select("id").single();
    if (error) { console.error("Generation logging unavailable", error.message); return null; }
    return data.id as string;
  } catch { return null; }
}

// The existing single chain participates when enabled and given nonzero weight.
// Missing migrations do not break deployments of the prior application.
export async function captionGenerationEnabled(client: SupabaseClient) {
  try {
    const { data, error } = await client.rpc("caption_generation_enabled");
    return Boolean(error) || data !== false;
  } catch { return true; }
}

export async function finishGenerationLog(client: SupabaseClient, id: string | null, output: string | null, error: string | null) {
  if (!id) return;
  try {
    const response = await client.from("llm_responses").insert({ request_id: id, output, error });
    const request = await client.from("generation_requests").update({ status: error ? "failed" : "succeeded" }).eq("id", id);
    if (response.error || request.error) console.error("Generation log could not be completed");
  } catch { console.error("Generation log could not be completed"); }
}
