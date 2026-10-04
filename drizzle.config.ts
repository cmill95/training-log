import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load .env.local the same way Next.js does (drizzle-kit doesn't on its own).
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Direct (unpooled) connection: migrations shouldn't go through the pooler.
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
