import { parse, type Node } from "acorn";
import { simple } from "acorn-walk";

type LoopNode = Node & { body: Node };

/**
 * Inserts a call to the harness's `__cmG()` at the start of every loop body so a runaway loop throws
 * instead of freezing the tab. Insertions never add newlines, so reported line numbers stay correct.
 * Code that does not parse is returned unchanged (it will fail with a SyntaxError in the sandbox anyway).
 */
export function guardLoops(js: string): string {
  let ast: Node;
  try {
    ast = parse(js, { ecmaVersion: "latest", sourceType: "script" });
  } catch {
    return js;
  }
  const inserts: { pos: number; text: string }[] = [];
  const visit = (node: Node) => {
    const body = (node as LoopNode).body;
    if (body.type === "BlockStatement") {
      inserts.push({ pos: body.start + 1, text: "__cmG();" });
    } else {
      inserts.push({ pos: body.start, text: "{__cmG();" }, { pos: body.end, text: "}" });
    }
  };
  simple(ast, {
    ForStatement: visit,
    WhileStatement: visit,
    DoWhileStatement: visit,
    ForInStatement: visit,
    ForOfStatement: visit,
  });
  let out = js;
  for (const { pos, text } of inserts.sort((a, b) => b.pos - a.pos)) {
    out = out.slice(0, pos) + text + out.slice(pos);
  }
  return out;
}
