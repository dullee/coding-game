import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

/** null when DATABASE_URL is not configured, so the game still works offline without accounts. */
export const db = url ? drizzle(neon(url), { schema }) : null;
