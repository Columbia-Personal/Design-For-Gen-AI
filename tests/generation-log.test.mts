import { test } from "node:test";
import assert from "node:assert/strict";
import { startGenerationLog, finishGenerationLog, captionGenerationEnabled } from "../src/lib/generation-log.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

test("generation logging records request, response and final status", async () => {
  const writes: Array<{ table: string; operation: string; value: unknown }> = [];
  const client = { from(table: string) { return {
    insert(value: unknown) { writes.push({ table, operation: "insert", value }); return { select() { return { single: async () => ({ data: { id: "request-id" }, error: null }) }; }, then(resolve: (value: unknown) => void) { resolve({ error: null }); } }; },
    update(value: unknown) { writes.push({ table, operation: "update", value }); return { eq: async () => ({ error: null }) }; },
  }; } } as unknown as SupabaseClient;
  const id = await startGenerationLog(client, "user-id", "model", "prompt");
  await finishGenerationLog(client, id, "caption", null);
  assert.deepEqual(writes, [
    { table: "generation_requests", operation: "insert", value: { user_id: "user-id", model: "model", prompt: "prompt", status: "started" } },
    { table: "llm_responses", operation: "insert", value: { request_id: "request-id", output: "caption", error: null } },
    { table: "generation_requests", operation: "update", value: { status: "succeeded" } },
  ]);
});

test("generation remains available if the configuration function is missing", async () => {
  const missing = { rpc: async () => ({ data: null, error: { message: "not found" } }) } as unknown as SupabaseClient;
  const disabled = { rpc: async () => ({ data: false, error: null }) } as unknown as SupabaseClient;
  assert.equal(await captionGenerationEnabled(missing), true);
  assert.equal(await captionGenerationEnabled(disabled), false);
});
