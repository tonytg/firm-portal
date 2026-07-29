// Create the private storage buckets. Idempotent. Run:
//   node --env-file=.env.local scripts/setup-storage.mjs
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

for (const id of ["evidence", "deliverables"]) {
  const { error } = await admin.storage.createBucket(id, {
    public: false,
    fileSizeLimit: "25MB",
  });
  if (error && !/already exists|resource already exists/i.test(error.message)) {
    console.log("FAIL", id, "-", error.message);
  } else {
    console.log("bucket ok:", id);
  }
}
