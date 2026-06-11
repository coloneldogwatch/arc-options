import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prefer direct connection (port 5432) for server actions — pgbouncer transaction
// mode can interfere with Drizzle's transaction wrapper. Direct is fine for a
// single-server Next.js app and avoids connection state issues.
const connectionString =
  process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
