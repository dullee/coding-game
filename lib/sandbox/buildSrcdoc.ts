import type { Code } from "../types";
import { HARNESS_SOURCE } from "./harness";
import { guardLoops } from "./loopGuard";

const escapeScript = (s: string) => s.replace(/<\/script/gi, "<\\/script");

/** Builds a complete document for a sandboxed iframe: harness, the user's HTML, then their (loop-guarded) JS. */
export function buildSrcdoc(code: Code): string {
  const head = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<script>${escapeScript(HARNESS_SOURCE)}</script>
</head>
<body>
${code.html}
<script>
`;
  const offset = head.split("\n").length - 1;
  return `${head.replace("__JS_LINE_OFFSET__", String(offset))}${escapeScript(guardLoops(code.js))}
</script>
</body>
</html>`;
}
