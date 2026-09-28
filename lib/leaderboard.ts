import "server-only";
import { count, desc, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, users } from "@/db/schema";

export interface LeaderRow {
  userId: string;
  name: string | null;
  image: string | null;
  score: number;
  solved?: number;
}

export async function bestScoresForUser(userId: string): Promise<Record<string, number>> {
  if (!db) return {};
  const rows = await db
    .select({ challengeId: attempts.challengeId, best: max(attempts.score) })
    .from(attempts)
    .where(eq(attempts.userId, userId))
    .groupBy(attempts.challengeId);
  return Object.fromEntries(rows.map((r) => [r.challengeId, r.best ?? 0]));
}

export async function bestScoreFor(userId: string, challengeId: string): Promise<number | null> {
  return (await bestScoresForUser(userId))[challengeId] ?? null;
}

/** Sum of each player's best score per challenge. */
export async function globalLeaderboard(limit = 25): Promise<LeaderRow[]> {
  if (!db) return [];
  const best = db
    .select({ userId: attempts.userId, challengeId: attempts.challengeId, best: max(attempts.score).as("best") })
    .from(attempts)
    .groupBy(attempts.userId, attempts.challengeId)
    .as("best");
  const total = sql<number>`sum(${best.best})`.mapWith(Number);
  return db
    .select({ userId: users.id, name: users.name, image: users.image, score: total, solved: count() })
    .from(best)
    .innerJoin(users, eq(users.id, best.userId))
    .groupBy(users.id)
    .orderBy(desc(total))
    .limit(limit);
}

export async function challengeLeaderboard(challengeId: string, limit = 10): Promise<LeaderRow[]> {
  if (!db) return [];
  const best = max(attempts.score);
  const rows = await db
    .select({ userId: users.id, name: users.name, image: users.image, score: best })
    .from(attempts)
    .innerJoin(users, eq(users.id, attempts.userId))
    .where(eq(attempts.challengeId, challengeId))
    .groupBy(users.id)
    .orderBy(desc(best))
    .limit(limit);
  return rows.map((r) => ({ ...r, score: r.score ?? 0 }));
}
