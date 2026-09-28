import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { and, count, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { aiReviews } from "@/db/schema";
import { getChallenge } from "@/lib/challenges";
import { analyze } from "@/lib/analysis";
import { ReviewSchema } from "@/lib/review";

const DAILY_LIMIT = 20;
const MAX_CODE = 20_000;

const Body = z.object({
  challengeId: z.string(),
  html: z.string().max(MAX_CODE),
  js: z.string().max(MAX_CODE),
});

const SYSTEM = `You are a friendly, precise code reviewer inside "Code Mimic", a game where learners recreate a reference web page's output with their own HTML and JavaScript.

Review the player's code against the goal. Focus on:
- Bugs and errors that stop the output from matching the reference.
- Correctness problems (wrong events, missing ids the challenge requires, state bugs).
- Best practices appropriate for a learner: semantic HTML, accessibility, const/let, ===, textContent over innerHTML, event delegation, avoiding repeated DOM lookups.

The automated checker's findings are included; confirm or refine them rather than repeating them verbatim, and add anything it missed. Line numbers refer to the numbered player code. Keep explanations short and concrete. The better solution must satisfy the challenge brief (same required ids and behaviour) and be idiomatic, modern, beginner-readable code.`;

const numbered = (src: string) =>
  src
    .split("\n")
    .map((l, i) => `${String(i + 1).padStart(3)}| ${l}`)
    .join("\n");

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI review is not configured on this server." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id || !db) {
    return NextResponse.json({ error: "Sign in to use AI review." }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { challengeId, html, js } = parsed.data;
  const challenge = getChallenge(challengeId);
  if (!challenge) return NextResponse.json({ error: "Unknown challenge." }, { status: 404 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ used }] = await db
    .select({ used: count() })
    .from(aiReviews)
    .where(and(eq(aiReviews.userId, session.user.id), gt(aiReviews.createdAt, since)));
  if (used >= DAILY_LIMIT) {
    return NextResponse.json({ error: `You have used all ${DAILY_LIMIT} AI reviews for today.` }, { status: 429 });
  }

  const issues = analyze({ html, js })
    .map((i) => `- [${i.severity}] ${i.lang.toUpperCase()} line ${i.line}: ${i.message}`)
    .join("\n");

  const prompt = `<challenge>
Title: ${challenge.title}
Brief: ${challenge.brief}
</challenge>

<reference_html>
${challenge.reference.html}
</reference_html>

<reference_js>
${challenge.reference.js || "(none)"}
</reference_js>

<player_html>
${numbered(html) || "(empty)"}
</player_html>

<player_js>
${numbered(js) || "(empty)"}
</player_js>

<automated_findings>
${issues || "(none)"}
</automated_findings>`;

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: zodOutputFormat(ReviewSchema) },
    });
    if (!response.parsed_output) {
      return NextResponse.json({ error: "The AI reviewer returned an unexpected answer. Try again." }, { status: 502 });
    }
    await db.insert(aiReviews).values({ userId: session.user.id });
    return NextResponse.json({ review: response.parsed_output, remaining: DAILY_LIMIT - used - 1 });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The AI reviewer is busy. Try again in a minute." }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic authentication failed: check ANTHROPIC_API_KEY");
      return NextResponse.json({ error: "AI review is misconfigured on the server." }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return NextResponse.json({ error: "AI review failed. Try again." }, { status: 502 });
    }
    throw error;
  }
}
