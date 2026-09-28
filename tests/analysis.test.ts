import { describe, expect, it } from "vitest";
import { analyze, analyzeHtml, analyzeJs } from "@/lib/analysis";
import { challenges } from "@/lib/challenges";

const rules = (issues: { rule: string }[]) => issues.map((i) => i.rule);

describe("HTML analysis", () => {
  it("flags unclosed and mismatched tags", () => {
    const issues = analyzeHtml("<div>\n  <p>Hello <strong>world</p>\n");
    expect(issues).toContainEqual(expect.objectContaining({ rule: "unclosed-tag", severity: "error", line: 2, message: expect.stringContaining("<strong>") }));
    expect(issues).toContainEqual(expect.objectContaining({ rule: "unclosed-tag", severity: "error", line: 1, message: "<div> is never closed." }));
  });

  it("flags stray closing tags and void closing tags", () => {
    const r = rules(analyzeHtml("<p>hi</p></div><br></br>"));
    expect(r).toContain("stray-close");
    expect(r).toContain("void-close");
  });

  it("treats optional end tags as info", () => {
    const issues = analyzeHtml("<ul><li>a<li>b</ul>");
    expect(issues.every((i) => i.severity === "info")).toBe(true);
  });

  it("flags accessibility and best-practice problems", () => {
    const r = rules(
      analyzeHtml(`<h1>T</h1><h3>x</h3><img src="a.png"><a>link</a><button onclick="go()">Go</button>
<input id="e"><center>c</center><p id="x"></p><p id="x"></p>`),
    );
    for (const rule of ["heading-skip", "img-alt", "link-href", "inline-handler", "input-label", "deprecated-tag", "duplicate-id"]) {
      expect(r).toContain(rule);
    }
  });

  it("accepts labelled inputs and ignores tags inside <script>", () => {
    const html = `<label for="a">A</label><input id="a"><label>B <input></label><script>if (a < b) { "</div>" }</script>`;
    expect(analyzeHtml(html).filter((i) => i.rule !== "script-in-html")).toEqual([]);
  });
});

describe("JS analysis", () => {
  it("reports syntax errors with location and a hint", () => {
    const [issue] = analyzeJs('const a = "oops;\n');
    expect(issue).toMatchObject({ rule: "syntax", severity: "error", line: 1 });
    expect(issue.suggestion).toMatch(/quote/);
  });

  it("reports missing closing brace", () => {
    const [issue] = analyzeJs("function f() {\n  return 1;\n");
    expect(issue.rule).toBe("syntax");
    expect(issue.suggestion).toMatch(/not closed/);
  });

  it("flags common flaws", () => {
    const js = `var total = 0;
if (total == 1) { totl = 2; }
let fixed = 3;
console.log(fixed);
eval("1");`;
    const r = rules(analyzeJs(js));
    for (const rule of ["no-var", "eqeqeq", "no-undef", "prefer-const", "no-console", "no-eval"]) expect(r).toContain(rule);
  });

  it("suggests a close identifier for typos", () => {
    const issue = analyzeJs("const counter = 1;\ncountr += 1;").find((i) => i.rule === "no-undef");
    expect(issue?.suggestion).toContain("counter");
  });

  it("flags DOM anti-patterns", () => {
    const js = `const items = ["a"];
const list = document.getElementById("list");
for (const item of items) {
  document.getElementById("list").innerHTML += "<li>" + item + "</li>";
  list.addEventListener("click", () => {});
}
document.write("hi");
document.getElementById("missing").textContent = "x";`;
    const r = rules(analyzeJs(js, new Set(["list"])));
    for (const rule of ["game/dom-query-in-loop", "game/no-innerhtml-concat", "game/listener-in-loop", "game/no-document-write", "game/unknown-id"]) {
      expect(r).toContain(rule);
    }
  });

  it("does not flag a query in a for...of header", () => {
    const js = `for (const li of document.querySelectorAll("li")) { li.remove(); }`;
    expect(rules(analyzeJs(js))).not.toContain("game/dom-query-in-loop");
  });

  it("counts ids created from JS as existing", () => {
    const js = `const d = document.createElement("div"); d.id = "made"; document.body.append(d); document.getElementById("made").remove();`;
    expect(rules(analyzeJs(js))).not.toContain("game/unknown-id");
  });
});

describe("challenge content", () => {
  it.each(challenges.map((c) => [c.id, c] as const))("%s reference and better solution are clean", (_, c) => {
    expect(analyze(c.reference)).toEqual([]);
    expect(analyze(c.betterSolution)).toEqual([]);
  });
});
