"use client";

import type { Code, Issue } from "../types";

/** Runs the analyzer on the server. Rejects if the request is aborted or fails. */
export async function fetchIssues(code: Code, signal?: AbortSignal): Promise<Issue[]> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(code),
    signal,
  });
  if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
  return (await res.json()).issues;
}
