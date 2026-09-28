"use client";

import { useState } from "react";
import type { Challenge, Code, EvalResult, Issue, ScoreResult } from "@/lib/types";
import type { Review } from "@/lib/review";
import { ScoreCard } from "./ScoreCard";

export interface CheckResult {
  score: ScoreResult;
  player: EvalResult;
  saved?: { best: number; newBest: boolean } | null;
  saveError?: string | null;
}

type Tab = "score" | "issues" | "tests" | "solution" | "ai";

const SEVERITY_STYLE: Record<Issue["severity"], string> = {
  error: "bg-bad/15 text-bad",
  warning: "bg-warn/15 text-warn",
  info: "bg-info/15 text-info",
};
const SEVERITY_LABEL: Record<Issue["severity"], string> = { error: "Error", warning: "Warning", info: "Tip" };

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  if (!code.trim()) return null;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted">
        {label}
        <button
          className="normal-case hover:text-foreground"
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }, () => {});
          }}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="mt-1 overflow-auto rounded border border-border bg-background p-3 font-mono text-xs leading-relaxed">{code}</pre>
    </div>
  );
}

function IssueList({ issues, onJump }: { issues: Issue[]; onJump: (i: Issue) => void }) {
  if (issues.length === 0) {
    return <p className="text-sm text-good">No problems found. Nice clean code!</p>;
  }
  return (
    <ul className="space-y-2">
      {issues.map((issue, idx) => (
        <li key={idx}>
          <button
            onClick={() => onJump(issue)}
            className="w-full rounded border border-border bg-panel-2 p-2.5 text-left transition-colors hover:border-accent"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className={`rounded px-1.5 py-0.5 font-semibold ${SEVERITY_STYLE[issue.severity]}`}>{SEVERITY_LABEL[issue.severity]}</span>
              <span className="font-mono text-muted">
                {issue.lang.toUpperCase()} line {issue.line}
              </span>
            </div>
            <div className="mt-1.5 text-sm">{issue.message}</div>
            {issue.suggestion && <div className="mt-1 text-sm text-muted">💡 {issue.suggestion}</div>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function FeedbackPanel({
  challenge,
  code,
  issues,
  check,
  onJump,
  aiEnabled,
  signedIn,
}: {
  challenge: Challenge;
  code: Code;
  issues: Issue[];
  check: CheckResult | null;
  onJump: (issue: Issue) => void;
  aiEnabled: boolean;
  signedIn: boolean;
}) {
  const [tab, setTab] = useState<Tab>("issues");
  const [shownCheck, setShownCheck] = useState<CheckResult | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewState, setReviewState] = useState<{ loading: boolean; error: string | null; remaining?: number }>({
    loading: false,
    error: null,
  });

  // Jump to the score tab whenever a new check result arrives.
  if (check && check !== shownCheck) {
    setShownCheck(check);
    setTab("score");
  }

  const counts = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity]++;

  async function requestReview() {
    setReviewState({ loading: true, error: null });
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, ...code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      setReview(data.review);
      setReviewState({ loading: false, error: null, remaining: data.remaining });
    } catch (e) {
      setReviewState({ loading: false, error: e instanceof Error ? e.message : "Review failed" });
    }
  }

  const tabs: [Tab, string, boolean][] = [
    ["score", "Score", !!check],
    ["issues", `Issues${issues.length ? ` (${issues.length})` : ""}`, true],
    ["tests", "Tests", !!check && check.player.tests.length > 0],
    ["solution", "Better solution", !!check],
    ["ai", "AI review", aiEnabled],
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center border-b border-border bg-panel-2 pl-2" role="tablist">
        {tabs
          .filter(([, , visible]) => visible)
          .map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        <span className="ml-auto mr-3 flex gap-2 font-mono text-[11px]">
          {counts.error > 0 && <span className="text-bad">● {counts.error}</span>}
          {counts.warning > 0 && <span className="text-warn">● {counts.warning}</span>}
          {counts.info > 0 && <span className="text-info">● {counts.info}</span>}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {tab === "score" && check && (
          <div>
            <ScoreCard score={check.score} saved={check.saved} />
            {check.saveError && <p className="mt-3 text-xs text-warn">{check.saveError}</p>}
            {check.player.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-bad">Runtime errors</h3>
                <ul className="mt-1 space-y-1 font-mono text-xs text-bad">
                  {check.player.errors.map((e, i) => <li key={i}>✖ {e}</li>)}
                </ul>
              </div>
            )}
            {check.player.logs.some((l) => l.text.startsWith("Interaction skipped")) && (
              <p className="mt-3 text-xs text-warn">
                Some interactions could not run because an element was missing:{" "}
                {check.player.logs.filter((l) => l.text.startsWith("Interaction skipped")).map((l) => l.text.replace("Interaction skipped: nothing matches ", "")).join(", ")}
              </p>
            )}
          </div>
        )}

        {tab === "issues" && <IssueList issues={issues} onJump={onJump} />}

        {tab === "tests" && check && (
          <ul className="space-y-1.5 text-sm">
            {check.player.tests.map((t) => (
              <li key={t.name} className="flex gap-2">
                <span className={t.pass ? "text-good" : "text-bad"}>{t.pass ? "✔" : "✖"}</span>
                <span>
                  {t.name}
                  {t.error && <span className="block font-mono text-xs text-muted">{t.error}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "solution" && (
          <div>
            <p className="text-sm text-muted">One idiomatic way to write this, and why it is better:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {challenge.betterSolution.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
            <CodeBlock label="HTML" code={challenge.betterSolution.html} />
            <CodeBlock label="JavaScript" code={challenge.betterSolution.js} />
          </div>
        )}

        {tab === "ai" && (
          <div>
            {!signedIn ? (
              <p className="text-sm text-muted">Sign in to get a personalised AI review of your code.</p>
            ) : (
              <div className="flex items-center gap-3">
                <button className="btn-primary" onClick={requestReview} disabled={reviewState.loading}>
                  {reviewState.loading ? "Reviewing…" : review ? "Review again" : "Ask AI for review"}
                </button>
                {reviewState.remaining !== undefined && (
                  <span className="text-xs text-muted">{reviewState.remaining} reviews left today</span>
                )}
              </div>
            )}
            {reviewState.error && <p className="mt-3 text-sm text-bad">{reviewState.error}</p>}
            {review && (
              <div className="mt-4 space-y-4">
                <p className="text-sm">{review.summary}</p>
                {review.issues.length > 0 && (
                  <ul className="space-y-2">
                    {review.issues.map((i, idx) => (
                      <li key={idx} className="rounded border border-border bg-panel-2 p-2.5 text-sm">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`rounded px-1.5 py-0.5 font-semibold ${SEVERITY_STYLE[i.severity === "tip" ? "info" : i.severity]}`}>
                            {i.severity === "tip" ? "Tip" : SEVERITY_LABEL[i.severity]}
                          </span>
                          <span className="font-mono text-muted">
                            {i.lang.toUpperCase()}
                            {i.line ? ` line ${i.line}` : ""}
                          </span>
                        </div>
                        <div className="mt-1.5">{i.problem}</div>
                        <div className="mt-1 whitespace-pre-wrap text-muted">💡 {i.fix}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Suggested solution</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{review.betterSolution.explanation}</p>
                  <CodeBlock label="HTML" code={review.betterSolution.html} />
                  <CodeBlock label="JavaScript" code={review.betterSolution.js} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
