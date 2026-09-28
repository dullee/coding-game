import type { Code, Issue } from "../types";
import { analyzeHtml, collectIds } from "./html";
import { analyzeJs } from "./js";

const ORDER = { error: 0, warning: 1, info: 2 } as const;

function safely(fn: () => Issue[]): Issue[] {
  try {
    return fn();
  } catch (error) {
    // A checker bug should never block playing or scoring.
    console.error("Code analysis failed", error);
    return [];
  }
}

export function analyze(code: Code): Issue[] {
  const issues = [...safely(() => analyzeHtml(code.html)), ...safely(() => analyzeJs(code.js, collectIds(code.html)))];
  return issues.sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.lang.localeCompare(b.lang) || a.line - b.line);
}

export function hasSyntaxError(issues: Issue[]): boolean {
  return issues.some((i) => i.rule === "syntax");
}

export { analyzeHtml, analyzeJs, collectIds };
