import { describe, expect, it } from "vitest";
import { codeSimilarity, sequenceSimilarity, tokenizeCode } from "@/lib/scoring/similarity";
import { compareSnapshots } from "@/lib/scoring/compareDom";
import { combine, qualityScore } from "@/lib/scoring/score";
import { guardLoops } from "@/lib/sandbox/loopGuard";
import { buildSrcdoc } from "@/lib/sandbox/buildSrcdoc";
import type { Issue, SnapNode } from "@/lib/types";

const el = (tag: string, children: SnapNode[] = [], extra: Partial<Extract<SnapNode, { k: "el" }>> = {}): SnapNode => ({
  k: "el",
  tag,
  children,
  ...extra,
});
const text = (v: string): SnapNode => ({ k: "text", v });

describe("similarity", () => {
  it("is 1 for identical and 0 for disjoint sequences", () => {
    expect(sequenceSimilarity(["a", "b"], ["a", "b"])).toBe(1);
    expect(sequenceSimilarity(["a"], ["b"])).toBe(0);
    expect(sequenceSimilarity([], [])).toBe(1);
  });

  it("ignores whitespace, comments and quote style", () => {
    expect(codeSimilarity(`const a = "x"; // hi`, `const   a='x';`)).toBe(1);
    expect(tokenizeCode("a === b")).toEqual(["a", "===", "b"]);
  });
});

describe("DOM comparison", () => {
  const ref = [el("h1", [text("Hello world")], { style: { color: "rgb(79, 70, 229)" } }), el("p", [text("Hi")])];

  it("scores identical output as 1", () => {
    expect(compareSnapshots(ref, ref)).toBe(1);
  });

  it("gives partial credit for near misses and ranks them", () => {
    const close = [el("h1", [text("Hello world")]), el("p", [text("Hi")])];
    const far = [el("div", [text("Something else")])];
    const closeScore = compareSnapshots(close, ref);
    const farScore = compareSnapshots(far, ref);
    expect(closeScore).toBeGreaterThan(0.7);
    expect(closeScore).toBeLessThan(1);
    expect(farScore).toBeLessThan(closeScore);
    expect(compareSnapshots([], ref)).toBe(0);
  });
});

describe("score", () => {
  const issue = (severity: Issue["severity"], rule = "x"): Issue => ({ rule, severity, lang: "js", line: 1, col: 1, message: "", suggestion: "" });

  it("penalizes issues and zeroes quality on syntax errors", () => {
    expect(qualityScore([])).toBe(1);
    expect(qualityScore([issue("warning"), issue("info")])).toBeCloseTo(0.9);
    expect(qualityScore([issue("error", "syntax")])).toBe(0);
    expect(qualityScore([], 2)).toBeCloseTo(0.7);
  });

  it("gives 1000 points and 3 stars for a perfect run", () => {
    expect(combine({ output: 1, tests: 1, quality: 1, closeness: 1 })).toMatchObject({ points: 1000, percent: 100, stars: 3 });
    expect(combine({ output: 1, tests: null, quality: 1, closeness: 1 }).points).toBe(1000);
  });

  it("does not reward clean code that produces nothing", () => {
    expect(combine({ output: 0, tests: 0, quality: 1, closeness: 0.2 }).percent).toBeLessThan(5);
  });
});

describe("loop guard", () => {
  it("inserts guards into block and non-block loop bodies without adding lines", () => {
    const src = "while (true) {}\nfor (;;) x++;\ndo y(); while (z)";
    const out = guardLoops(src);
    expect(out).toBe("while (true) {__cmG();}\nfor (;;) {__cmG();x++;}\ndo {__cmG();y();} while (z)");
    expect(out.split("\n").length).toBe(src.split("\n").length);
  });

  it("returns unparsable code unchanged", () => {
    expect(guardLoops("while (")).toBe("while (");
  });

  it("builds a srcdoc with the correct JS line offset", () => {
    const doc = buildSrcdoc({ html: "<p>hi</p>\n<p>two</p>", js: "boom();" });
    const lines = doc.split("\n");
    const offset = Number(/JS_LINE_OFFSET = (\d+)/.exec(doc)![1]);
    expect(lines[offset]).toBe("boom();");
  });
});

describe("change comparison", () => {
  const page = (count: string) => [el("body", [el("span", [text(count)], { id: "count" }), el("button", [text("+1")])])];

  it("rewards matching changes and ignores static similarity", async () => {
    const { compareChanges } = await import("@/lib/scoring/compareDom");
    const reference = { before: page("0"), after: page("2") };
    expect(compareChanges({ before: page("0"), after: page("2") }, reference)).toBe(1);
    expect(compareChanges({ before: page("0"), after: page("0") }, reference)).toBe(0);
    expect(compareChanges({ before: page("0"), after: page("3") }, reference)).toBeCloseTo(0.5);
  });
});
