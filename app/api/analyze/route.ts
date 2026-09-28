import { NextResponse } from "next/server";
import { z } from "zod";
import { analyze } from "@/lib/analysis";

// ESLint does not bundle cleanly for the browser, so the editor's live analysis runs here.
const Body = z.object({ html: z.string().max(50_000), js: z.string().max(50_000) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  return NextResponse.json({ issues: analyze(parsed.data) });
}
