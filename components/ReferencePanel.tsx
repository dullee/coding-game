"use client";

import { useMemo, useState } from "react";
import { buildSrcdoc } from "@/lib/sandbox/buildSrcdoc";
import type { Challenge } from "@/lib/types";
import { CodeEditor } from "./CodeEditor";
import { PreviewPane } from "./PreviewPane";

type Tab = "output" | "html" | "js";

export function ReferencePanel({ challenge }: { challenge: Challenge }) {
  const [tab, setTab] = useState<Tab>("output");
  const [reloads, setReloads] = useState(0);
  const srcdoc = useMemo(() => buildSrcdoc(challenge.reference), [challenge]);
  const tabs: [Tab, string][] = [["output", "Output"], ["html", "HTML"]];
  if (challenge.reference.js) tabs.push(["js", "JS"]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center border-b border-border bg-panel-2 pl-2" role="tablist">
        <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-accent">Reference</span>
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        {tab === "output" && (
          <button className="ml-auto mr-2 text-xs text-muted hover:text-foreground" onClick={() => setReloads((n) => n + 1)}>
            ↻ Reset
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "output" ? (
          <PreviewPane key={reloads} srcdoc={srcdoc} title="Reference output" showConsole={false} />
        ) : (
          <CodeEditor lang={tab} value={challenge.reference[tab]} readOnly pathPrefix={`reference-${challenge.id}`} />
        )}
      </div>
    </div>
  );
}
