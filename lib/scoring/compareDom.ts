import type { SnapNode } from "../types";
import { sequenceSimilarity } from "./similarity";

/** Flattens a DOM snapshot into structure tokens (tags, ids, classes, attributes) and style tokens. */
export function snapshotTokens(nodes: SnapNode[]): { structure: string[]; text: string[]; style: string[] } {
  const structure: string[] = [];
  const text: string[] = [];
  const style: string[] = [];
  const walk = (list: SnapNode[]) => {
    for (const n of list) {
      if (n.k === "text") {
        for (const w of n.v.split(/\s+/).filter(Boolean)) {
          structure.push(`"${w}`);
          text.push(w);
        }
        continue;
      }
      structure.push(`<${n.tag}`);
      if (n.id) structure.push(`#${n.id}`);
      for (const c of n.cls ?? []) structure.push(`.${c}`);
      for (const [k, v] of Object.entries(n.attrs ?? {})) structure.push(`[${k}=${v}]`);
      for (const [k, v] of Object.entries(n.style ?? {})) style.push(`${n.tag}{${k}:${v}}`);
      walk(n.children);
      structure.push(`</${n.tag}`);
    }
  };
  walk(nodes);
  return { structure, text, style };
}

/**
 * How closely the player's rendered page matches the reference, in [0, 1].
 * Structure (tags/attributes/text in order) dominates; visible text and computed styles refine it.
 */
export function compareSnapshots(player: SnapNode[], reference: SnapNode[]): number {
  const p = snapshotTokens(player);
  const r = snapshotTokens(reference);
  const structure = sequenceSimilarity(p.structure, r.structure);
  const text = sequenceSimilarity(p.text, r.text);
  const style = sequenceSimilarity(p.style, r.style);
  return 0.55 * structure + 0.25 * text + 0.2 * style;
}

function counts(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/**
 * Tokens added (+) and removed (-) between two snapshots of the same page. Form-control values are
 * skipped: typing into a field changes them no matter what the player's code does.
 */
export function changeTokens(before: SnapNode[], after: SnapNode[]): string[] {
  const all = (n: SnapNode[]) => {
    const t = snapshotTokens(n);
    return [...t.structure.filter((tok) => !tok.startsWith("[value=")), ...t.style];
  };
  const b = counts(all(before));
  const a = counts(all(after));
  const out: string[] = [];
  for (const [tok, n] of a) for (let i = b.get(tok) ?? 0; i < n; i++) out.push(`+${tok}`);
  for (const [tok, n] of b) for (let i = a.get(tok) ?? 0; i < n; i++) out.push(`-${tok}`);
  return out;
}

/** Dice similarity of two multisets, in [0, 1]. */
export function multisetSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  const cb = counts(b);
  let shared = 0;
  for (const [tok, n] of counts(a)) shared += Math.min(n, cb.get(tok) ?? 0);
  return (2 * shared) / (a.length + b.length);
}

/** How similarly the two pages *changed* in response to the same interactions. */
export function compareChanges(
  player: { before: SnapNode[]; after: SnapNode[] },
  reference: { before: SnapNode[]; after: SnapNode[] },
): number {
  return multisetSimilarity(changeTokens(player.before, player.after), changeTokens(reference.before, reference.after));
}
