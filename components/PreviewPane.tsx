"use client";

import { useEffect, useRef, useState } from "react";
import { isHarnessMessage } from "@/lib/sandbox/runner";
import type { LogEntry } from "@/lib/types";

const LEVEL_STYLE: Record<LogEntry["level"] | "runtime", string> = {
  log: "text-foreground",
  info: "text-info",
  warn: "text-warn",
  error: "text-bad",
  runtime: "text-bad",
};

/** Live, interactive preview of a sandboxed document with its console output. Remount (key) to reset. */
export function PreviewPane({ srcdoc, title, showConsole = true }: { srcdoc: string; title: string; showConsole?: boolean }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<{ level: LogEntry["level"] | "runtime"; text: string }[]>([]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || !isHarnessMessage(e.data)) return;
      const msg = e.data;
      if (msg.type === "log") setLogs((l) => [...l.slice(-199), { level: msg.level, text: msg.text }]);
      if (msg.type === "runtime-error") setLogs((l) => [...l.slice(-199), { level: "runtime", text: msg.text }]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <iframe
        ref={frameRef}
        title={title}
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={srcdoc}
        className="min-h-0 w-full flex-1 bg-white"
      />
      {showConsole && (
        <div className="h-28 shrink-0 overflow-auto border-t border-border bg-panel font-mono text-xs">
          <div className="sticky top-0 flex items-center justify-between bg-panel px-3 py-1 text-[10px] uppercase tracking-wide text-muted">
            Console
            {logs.length > 0 && (
              <button className="normal-case hover:text-foreground" onClick={() => setLogs([])}>clear</button>
            )}
          </div>
          {logs.length === 0 && <div className="px-3 text-muted">No output</div>}
          {logs.map((l, i) => (
            <div key={i} className={`border-b border-border/50 px-3 py-0.5 whitespace-pre-wrap ${LEVEL_STYLE[l.level]}`}>
              {l.level === "runtime" ? "✖ " : ""}
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
