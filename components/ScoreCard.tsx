import type { ScoreResult } from "@/lib/types";
import { WEIGHTS } from "@/lib/scoring/score";
import { Stars } from "./Stars";

function Bar({ label, value, weight, hint }: { label: string; value: number | null; weight: number; hint: string }) {
  const pct = value === null ? null : Math.round(value * 100);
  const color = pct === null ? "bg-border" : pct >= 90 ? "bg-good" : pct >= 60 ? "bg-warn" : "bg-bad";
  return (
    <div title={hint}>
      <div className="flex justify-between text-xs">
        <span>
          {label} <span className="text-muted">· {Math.round(weight * 100)}%</span>
        </span>
        <span className="font-mono">{pct === null ? "n/a" : `${pct}%`}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-panel-2">
        <div className={`h-full ${color}`} style={{ width: `${pct ?? 0}%` }} />
      </div>
    </div>
  );
}

export function ScoreCard({ score, saved }: { score: ScoreResult; saved?: { best: number; newBest: boolean } | null }) {
  const b = score.breakdown;
  const hasTests = b.tests !== null;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="shrink-0 text-center sm:w-36">
        <div className="font-mono text-4xl font-semibold">{score.percent.toFixed(1)}%</div>
        <Stars count={score.stars} className="text-xl" />
        <div className="text-xs text-muted">{score.points} / 1000 pts</div>
        {saved && (
          <div className={`mt-1 text-xs ${saved.newBest ? "text-good" : "text-muted"}`}>
            {saved.newBest ? "New personal best!" : `Best: ${saved.best} pts`}
          </div>
        )}
      </div>
      <div className="grid flex-1 gap-2.5">
        <Bar
          label="Output match"
          value={b.output}
          weight={hasTests ? WEIGHTS.output : WEIGHTS.output + WEIGHTS.tests}
          hint="How closely your rendered page (structure, text and styles, before and after interactions) matches the reference."
        />
        {hasTests && <Bar label="Behaviour tests" value={b.tests} weight={WEIGHTS.tests} hint="Checks that the page works as the brief describes." />}
        <Bar label="Code quality" value={b.quality} weight={WEIGHTS.quality} hint="Starts at 100% and loses points for each error, warning and tip. Scaled by output match." />
        <Bar label="Code closeness" value={b.closeness} weight={WEIGHTS.closeness} hint="Token-level similarity to the reference source. A small part of the score: other correct solutions are fine." />
      </div>
    </div>
  );
}
