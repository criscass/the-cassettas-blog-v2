import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Read the connection string from the runtime env. `import.meta.env` covers
// Astro's SSR runtime (local + Vercel); `process.env` covers plain Node
// contexts (drizzle-kit, tests). Neon's HTTP driver only opens a connection on
// the first query, so constructing it here is cheap and never hits the network
// at import/build time.
const connectionString =
  import.meta.env?.DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (see .env.example) — create a Neon project and paste its connection string.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
