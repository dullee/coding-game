import type { Code, EvalResult, Issue, ScoreBreakdown, ScoreResult } from "../types";
import { compareChanges, compareSnapshots } from "./compareDom";
import { codeSimilarity } from "./similarity";

export const WEIGHTS = { output: 0.45, tests: 0.25, quality: 0.2, closeness: 0.1 };
const PENALTY = { error: 25, warning: 8, info: 2 } as const;
const RUNTIME_ERROR_PENALTY = 15;

export function qualityScore(issues: Issue[], runtimeErrors = 0): number {
  if (issues.some((i) => i.rule === "syntax")) return 0;
  const penalty = issues.reduce((sum, i) => sum + PENALTY[i.severity], 0) + runtimeErrors * RUNTIME_ERROR_PENALTY;
  return Math.max(0, 1 - penalty / 100);
}

export function closenessScore(player: Code, reference: Code): number {
  return codeSimilarity(`${player.html}\n${player.js}`, `${reference.html}\n${reference.js}`);
}

export function outputScore(player: EvalResult, reference: EvalResult, hasInteractions: boolean): number {
  if (player.timedOut) return 0;
  const before = compareSnapshots(player.before, reference.before);
  if (!hasInteractions) return before;
  // Interactive pages mostly look alike before anyone clicks, so what changes counts most.
  const after = compareSnapshots(player.after, reference.after);
  return 0.25 * before + 0.25 * after + 0.5 * compareChanges(player, reference);
}

export function combine(b: ScoreBreakdown): ScoreResult {
  // Clean code only earns points in proportion to how much of the output it actually achieves.
  const quality = b.quality * b.output;
  const raw =
    b.tests === null
      ? (WEIGHTS.output + WEIGHTS.tests) * b.output + WEIGHTS.quality * quality + WEIGHTS.closeness * b.closeness
      : WEIGHTS.output * b.output + WEIGHTS.tests * b.tests + WEIGHTS.quality * quality + WEIGHTS.closeness * b.closeness;
  const percent = Math.round(Math.min(1, Math.max(0, raw)) * 1000) / 10;
  const stars = percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 50 ? 1 : 0;
  return { points: Math.round(percent * 10), percent, stars, breakdown: b };
}

export function computeScore(args: {
  code: Code;
  referenceCode: Code;
  issues: Issue[];
  player: EvalResult;
  reference: EvalResult;
  hasInteractions: boolean;
}): ScoreResult {
  const { code, referenceCode, issues, player, reference, hasInteractions } = args;
  const tests = player.tests.length ? player.tests.filter((t) => t.pass).length / player.tests.length : null;
  return combine({
    output: outputScore(player, reference, hasInteractions),
    tests: player.timedOut ? 0 : tests,
    quality: qualityScore(issues, player.errors.length),
    closeness: closenessScore(code, referenceCode),
  });
}
