import "server-only";

/**
 * Node < 22 has no global WebSocket, but supabase-js constructs a realtime
 * client eagerly and requires one. We never use realtime, so a shim satisfies
 * it. On Node 22+ (and edge), where WebSocket is global, this is a no-op and
 * `ws` is never loaded.
 */
export async function ensureNodeWebSocket(): Promise<void> {
  const g = globalThis as { WebSocket?: unknown };
  if (typeof g.WebSocket === "undefined") {
    const mod = await import("ws");
    g.WebSocket = mod.default as unknown;
  }
}
