import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Migrations require a direct connection — pgbouncer (DATABASE_URL) rejects DDL
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!;

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
