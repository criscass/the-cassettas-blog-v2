import { defineConfig } from "drizzle-kit";

// drizzle-kit runs in plain Node (no Vite), so it reads process.env. Load .env
// via the --env-file flag in the npm script (see package.json db:* scripts).
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (see .env.example) before running db:push / db:generate.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  verbose: true,
  strict: true,
});
