"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Challenge, Code, EvalResult, Issue, Lang } from "@/lib/types";
import { fetchIssues } from "@/lib/analysis/client";
import { buildSrcdoc } from "@/lib/sandbox/buildSrcdoc";
import { evaluateInSandbox } from "@/lib/sandbox/runner";
import { computeScore } from "@/lib/scoring/score";
import { CodeEditor } from "./CodeEditor";
import { DifficultyBadge } from "./DifficultyBadge";
import { FeedbackPanel, type CheckResult } from "./FeedbackPanel";
import { PreviewPane } from "./PreviewPane";
import { ReferencePanel } from "./ReferencePanel";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function readDraft(key: string): Code | null {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.html === "string" && typeof parsed.js === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export default function GameClient({
  challenge,
  signedIn,
  aiEnabled,
  initialBest,
  nextId,
}: {
  challenge: Challenge;
  signedIn: boolean;
  aiEnabled: boolean;
  initialBest: number | null;
  nextId: string | null;
}) {
  const draftKey = `codemimic:draft:${challenge.id}`;
  const [code, setCode] = useState<Code>(() => readDraft(draftKey) ?? challenge.starter);
  const [tab, setTab] = useState<Lang>("html");
  const [jumpTo, setJumpTo] = useState<{ line: number; col: number; nonce: number } | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState<null | "check" | "submit">(null);
  const [best, setBest] = useState(initialBest);
  const [runError, setRunError] = useState<string | null>(null);
  const referenceEval = useRef<Promise<EvalResult> | null>(null);

  const debounced = useDebounced(code, 400);
  const srcdoc = useMemo(() => buildSrcdoc(debounced), [debounced]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(debounced));
    } catch {
      // Storage unavailable (private mode etc.): drafts just won't persist.
    }
  }, [debounced, draftKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchIssues(debounced, controller.signal).then(setIssues, () => {});
    return () => controller.abort();
  }, [debounced]);

  const evaluate = useCallback(async () => {
    referenceEval.current ??= evaluateInSandbox(challenge.reference, challenge.interactions, challenge.tests);
    const [reference, player, current] = await Promise.all([
      referenceEval.current,
      evaluateInSandbox(code, challenge.interactions, challenge.tests),
      fetchIssues(code),
    ]);
    setIssues(current);
    const score = computeScore({
      code,
      referenceCode: challenge.reference,
      issues: current,
      player,
      reference,
      hasInteractions: challenge.interactions.length > 0,
    });
    return { score, player };
  }, [challenge, code]);

  const onCheck = useCallback(async () => {
    if (busy) return;
    setBusy("check");
    setRunError(null);
    try {
      setCheck(await evaluate());
    } catch (error) {
      console.error(error);
      setRunError("Something went wrong while checking your code. Please try again.");
    } finally {
      setBusy(null);
    }
  }, [busy, evaluate]);

  const onSubmit = async () => {
    if (busy) return;
    setBusy("submit");
    setRunError(null);
    let result: Awaited<ReturnType<typeof evaluate>>;
    try {
      result = await evaluate();
    } catch (error) {
      console.error(error);
      setRunError("Something went wrong while checking your code. Please try again.");
      setBusy(null);
      return;
    }
    try {
      if (!signedIn) {
        setCheck({ ...result, saveError: "Sign in with GitHub to save your score to the leaderboard." });
        return;
      }
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          ...code,
          output: result.score.breakdown.output,
          tests: result.score.breakdown.tests,
          runtimeErrors: result.player.errors.length,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheck({ ...result, saveError: data.error ?? "Could not save your score." });
        return;
      }
      setBest(data.best);
      setCheck({ ...result, score: data.score, saved: { best: data.best, newBest: data.newBest } });
    } catch {
      setCheck({ ...result, saveError: "Could not reach the server to save your score." });
    } finally {
      setBusy(null);
    }
  };

  // Cmd/Ctrl + Enter runs a check from anywhere, including inside the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        onCheck();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCheck]);

  const jump = (issue: Issue) => {
    setTab(issue.lang);
    setJumpTo({ line: issue.line, col: issue.col, nonce: Date.now() });
  };

  const tabIssues = (lang: Lang) => issues.filter((i) => i.lang === lang);
  const tabBadge = (lang: Lang) => {
    const list = tabIssues(lang);
    if (list.some((i) => i.severity === "error")) return "bg-bad";
    if (list.some((i) => i.severity === "warning")) return "bg-warn";
    return null;
  };

  return (
    <main data-game className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="font-medium">{challenge.title}</h1>
          <DifficultyBadge level={challenge.difficulty} />
          {best !== null && <span className="font-mono text-xs text-muted">best {best} pts</span>}
        </div>
        <p className="min-w-0 flex-1 basis-80 text-sm text-muted">{challenge.brief}</p>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              if (confirm("Reset your code to the starter template?")) setCode(challenge.starter);
            }}
          >
            Reset
          </button>
          <button className="btn-ghost" onClick={onCheck} disabled={!!busy} title="Cmd/Ctrl + Enter">
            {busy === "check" ? "Checking…" : "Check"}
          </button>
          <button className="btn-primary" onClick={onSubmit} disabled={!!busy}>
            {busy === "submit" ? "Submitting…" : "Submit"}
          </button>
          {runError && <span className="text-xs text-bad">{runError}</span>}
          {nextId && check && check.score.stars > 0 && (
            <Link href={`/play/${nextId}`} className="btn-ghost">Next →</Link>
          )}
        </div>
      </div>

      <details className="border-b border-border px-4 py-1.5 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-foreground">Hints ({challenge.hints.length})</summary>
        <ul className="mt-1 mb-1 list-disc pl-5 text-muted">
          {challenge.hints.map((h) => <li key={h}>{h}</li>)}
        </ul>
      </details>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-border lg:grid-cols-2 lg:grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="h-[45vh] min-h-0 bg-background lg:h-auto">
          <ReferencePanel challenge={challenge} />
        </section>

        <section className="flex h-[55vh] min-h-0 flex-col bg-background lg:h-auto">
          <div className="flex items-center border-b border-border bg-panel-2 pl-2" role="tablist">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-good">Your code</span>
            {(["html", "js"] as const).map((lang) => {
              const badge = tabBadge(lang);
              return (
                <button key={lang} role="tab" aria-selected={tab === lang} className="tab flex items-center gap-1.5" onClick={() => setTab(lang)}>
                  {lang === "html" ? "HTML" : "JS"}
                  {badge && <span className={`h-1.5 w-1.5 rounded-full ${badge}`} />}
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              lang={tab}
              value={code[tab]}
              onChange={(v) => setCode((c) => ({ ...c, [tab]: v }))}
              issues={issues}
              pathPrefix={`player-${challenge.id}`}
              jumpTo={jumpTo}
            />
          </div>
        </section>

        <section className="flex h-[45vh] min-h-0 flex-col bg-background lg:h-auto">
          <div className="border-b border-border bg-panel-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-good">
            Your output
          </div>
          <div className="min-h-0 flex-1">
            <PreviewPane key={srcdoc} srcdoc={srcdoc} title="Your output" />
          </div>
        </section>

        <section className="h-[50vh] min-h-0 bg-panel lg:h-auto">
          <FeedbackPanel
            challenge={challenge}
            code={code}
            issues={issues}
            check={check}
            onJump={jump}
            aiEnabled={aiEnabled}
            signedIn={signedIn}
          />
        </section>
      </div>
    </main>
  );
}
