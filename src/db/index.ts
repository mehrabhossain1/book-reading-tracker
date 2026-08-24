import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Neon's WebSocket pool (rather than the HTTP driver) because logging reading
 * progress writes two tables inside a single transaction, and the HTTP driver
 * cannot open one. Node 22+ supplies the global WebSocket this needs.
 *
 * Cached on globalThis so Next's dev hot-reload doesn't leak a pool per edit.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool = globalForDb.pool ?? new Pool({ connectionString: env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export type Db = typeof db;
