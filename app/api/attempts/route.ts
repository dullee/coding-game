import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { getChallenge } from "@/lib/challenges";
import { analyze } from "@/lib/analysis";
import { closenessScore, combine, qualityScore } from "@/lib/scoring/score";
import { bestScoreFor } from "@/lib/leaderboard";

const MAX_CODE = 50_000;
const unit = z.number().min(0).max(1);

const Body = z.object({
  challengeId: z.string(),
  html: z.string().max(MAX_CODE),
  js: z.string().max(MAX_CODE),
  // Output and test results can only be measured in the browser, so they come from the client.
  output: unit,
  tests: unit.nullable(),
  runtimeErrors: z.number().int().min(0).max(50),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !db) {
    return NextResponse.json({ error: "Sign in to save your score." }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });

  const { challengeId, html, js, output, tests, runtimeErrors } = parsed.data;
  const challenge = getChallenge(challengeId);
  if (!challenge) return NextResponse.json({ error: "Unknown challenge." }, { status: 404 });

  // Recompute everything that can be checked server-side.
  const code = { html, js };
  const score = combine({
    output,
    tests: challenge.tests.length ? tests ?? 0 : null,
    quality: qualityScore(analyze(code), runtimeErrors),
    closeness: closenessScore(code, challenge.reference),
  });

  const previousBest = await bestScoreFor(session.user.id, challengeId);
  await db.insert(attempts).values({
    userId: session.user.id,
    challengeId,
    score: score.points,
    breakdown: score.breakdown,
    html,
    js,
  });

  return NextResponse.json({
    score,
    best: Math.max(previousBest ?? 0, score.points),
    newBest: previousBest === null || score.points > previousBest,
  });
}
