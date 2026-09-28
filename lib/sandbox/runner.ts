"use client";

import type { Code, EvalResult, LogEntry, Step, ChallengeTest } from "../types";
import { buildSrcdoc } from "./buildSrcdoc";

const TIMEOUT_MS = 4000;

type HarnessMessage =
  | { __codemimic: true; type: "ready" }
  | { __codemimic: true; type: "log"; level: LogEntry["level"]; text: string }
  | { __codemimic: true; type: "runtime-error"; text: string }
  | { __codemimic: true; type: "result"; runId: string; result: EvalResult };

export function isHarnessMessage(data: unknown): data is HarnessMessage {
  return typeof data === "object" && data !== null && (data as { __codemimic?: unknown }).__codemimic === true;
}

/**
 * Loads `code` into a fresh hidden sandbox, replays the interactions, runs the tests and returns
 * DOM snapshots. Resolves with `timedOut: true` if the page never answers (e.g. an unguarded hang).
 */
export function evaluateInSandbox(code: Code, interactions: Step[], tests: ChallengeTest[]): Promise<EvalResult> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts allow-forms");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:800px;height:600px;opacity:0;pointer-events:none;border:0";
    const runId = Math.random().toString(36).slice(2);
    const logs: LogEntry[] = [];
    const errors: string[] = [];

    const finish = (result: EvalResult) => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow || !isHarnessMessage(e.data)) return;
      const msg = e.data;
      if (msg.type === "ready") {
        iframe.contentWindow?.postMessage({ __codemimic: true, type: "evaluate", runId, interactions, tests }, "*");
      } else if (msg.type === "log") {
        logs.push({ level: msg.level, text: msg.text });
      } else if (msg.type === "runtime-error") {
        errors.push(msg.text);
      } else if (msg.type === "result" && msg.runId === runId) {
        finish(msg.result);
      }
    };

    const timer = window.setTimeout(() => {
      finish({
        before: [],
        after: [],
        tests: tests.map((t) => ({ name: t.name, pass: false, error: "Page did not respond in time" })),
        logs,
        errors: [...errors, "Your page did not finish running in time. Check for infinite loops."],
        timedOut: true,
      });
    }, TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    iframe.srcdoc = buildSrcdoc(code);
    document.body.appendChild(iframe);
  });
}
