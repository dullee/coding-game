import type { Challenge } from "@/lib/types";

const STYLES: Record<Challenge["difficulty"], string> = {
  easy: "text-good border-good/40",
  medium: "text-warn border-warn/40",
  hard: "text-bad border-bad/40",
};

export function DifficultyBadge({ level }: { level: Challenge["difficulty"] }) {
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[level]}`}>{level}</span>;
}
