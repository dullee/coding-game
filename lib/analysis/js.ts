import { Linter } from "eslint/universal";
import type { Linter as LinterNS, Rule } from "eslint";
import globals from "globals";
import type { Issue, Severity } from "../types";

type Node = Rule.Node;

const LOOPS = new Set(["ForStatement", "WhileStatement", "DoWhileStatement", "ForInStatement", "ForOfStatement"]);
const ITERATING_METHODS = new Set(["forEach", "map", "filter", "reduce", "some", "every", "find"]);
const DOM_QUERIES = new Set([
  "getElementById", "querySelector", "querySelectorAll", "getElementsByClassName", "getElementsByTagName",
]);

function memberCall(node: Node): { object: Node; name: string } | null {
  if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") return null;
  const prop = node.callee.property;
  if (node.callee.computed || prop.type !== "Identifier") return null;
  return { object: node.callee.object as Node, name: prop.name };
}

const isDocument = (n: Node) => n.type === "Identifier" && n.name === "document";

/** True when `node` runs once per iteration of some loop (loop body, or an array-iteration callback). */
function runsInLoop(context: Rule.RuleContext, node: Node): boolean {
  const ancestors = context.sourceCode.getAncestors(node) as Node[];
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    const child = (ancestors[i + 1] ?? node) as Node;
    if (LOOPS.has(a.type)) {
      // `for (x of document.querySelectorAll(...))` evaluates `right` only once.
      if ((a.type === "ForOfStatement" || a.type === "ForInStatement") && child === (a.right as Node)) continue;
      if (a.type === "ForStatement" && child === (a.init as Node)) continue;
      return true;
    }
    if (a.type === "FunctionExpression" || a.type === "ArrowFunctionExpression") {
      const parent = ancestors[i - 1];
      const call = parent && memberCall(parent);
      if (call && ITERATING_METHODS.has(call.name)) return true;
      return false;
    }
    if (a.type === "FunctionDeclaration") return false;
  }
  return false;
}

const gameRules: Record<string, Rule.RuleModule> = {
  "no-document-write": {
    create: (context) => ({
      CallExpression(node) {
        const call = memberCall(node);
        if (call && isDocument(call.object) && (call.name === "write" || call.name === "writeln")) {
          context.report({ node, message: `document.${call.name}() overwrites or corrupts the page.` });
        }
      },
    }),
  },
  "no-innerhtml-concat": {
    create: (context) => ({
      AssignmentExpression(node) {
        const left = node.left;
        if (left.type !== "MemberExpression" || left.property.type !== "Identifier") return;
        if (left.property.name !== "innerHTML" && left.property.name !== "outerHTML") return;
        const right = node.right;
        const dynamic =
          node.operator === "+=" ||
          (right.type === "BinaryExpression" && right.operator === "+") ||
          (right.type === "TemplateLiteral" && right.expressions.length > 0);
        if (dynamic) {
          context.report({ node, message: `Building ${left.property.name} from strings and variables.` });
        } else if (right.type === "Literal" && typeof right.value === "string" && !right.value.includes("<") && right.value !== "") {
          context.report({ node, message: "innerHTML used for plain text." });
        }
      },
    }),
  },
  "dom-query-in-loop": {
    create: (context) => ({
      CallExpression(node) {
        const call = memberCall(node);
        if (call && isDocument(call.object) && DOM_QUERIES.has(call.name) && runsInLoop(context, node)) {
          context.report({ node, message: `document.${call.name}() is called on every loop iteration.` });
        }
      },
    }),
  },
  "listener-in-loop": {
    create: (context) => ({
      CallExpression(node) {
        const call = memberCall(node);
        if (call && call.name === "addEventListener" && runsInLoop(context, node)) {
          context.report({ node, message: "addEventListener() is called inside a loop." });
        }
      },
    }),
  },
  "unknown-id": {
    meta: { schema: false },
    create: (context) => {
      const ids = new Set<string>((context.options[0] as { ids?: string[] } | undefined)?.ids ?? []);
      const check = (node: Node, id: string) => {
        if (!ids.has(id)) context.report({ node, message: `No element with id "${id}" exists in your HTML.` });
      };
      return {
        CallExpression(node) {
          const call = memberCall(node);
          const arg = node.arguments[0];
          if (!call || !isDocument(call.object) || arg?.type !== "Literal" || typeof arg.value !== "string") return;
          if (call.name === "getElementById") check(node, arg.value);
          if (call.name === "querySelector") {
            const m = /^#([\w-]+)$/.exec(arg.value.trim());
            if (m) check(node, m[1]);
          }
        },
      };
    },
  },
};

const SEVERITY: Record<string, Severity> = {
  "no-undef": "error",
  "no-const-assign": "error",
  "no-dupe-keys": "error",
  "no-dupe-args": "error",
  "no-duplicate-case": "error",
  "no-redeclare": "error",
  "no-func-assign": "error",
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-with": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  "no-unsafe-negation": "error",
  "no-use-before-define": "error",
  "no-unused-vars": "warning",
  "no-var": "warning",
  eqeqeq: "warning",
  "no-unreachable": "warning",
  "no-self-assign": "warning",
  "no-cond-assign": "warning",
  "no-constant-condition": "warning",
  "no-unused-expressions": "warning",
  "no-loop-func": "warning",
  "array-callback-return": "warning",
  "no-fallthrough": "warning",
  "no-unmodified-loop-condition": "warning",
  "game/no-document-write": "warning",
  "game/no-innerhtml-concat": "warning",
  "game/dom-query-in-loop": "warning",
  "game/unknown-id": "warning",
  "prefer-const": "info",
  "no-empty": "info",
  "no-console": "info",
  "no-alert": "info",
  "game/listener-in-loop": "info",
};

const SUGGESTIONS: Record<string, string> = {
  "no-const-assign": "Declare it with let if its value needs to change.",
  "no-dupe-keys": "Remove or rename the duplicate key. Only the last one is kept.",
  "no-dupe-args": "Give each parameter a different name.",
  "no-duplicate-case": "Remove the duplicate case. Only the first one can ever match.",
  "no-redeclare": "Declare each variable once, then just assign to it.",
  "no-func-assign": "Use a different name for the variable, or declare the function with const.",
  "no-eval": "eval runs any string as code, which is slow and a security risk. Call functions directly instead.",
  "no-implied-eval": "Pass a function instead of a string, e.g. setTimeout(() => doThing(), 100).",
  "no-with": "Access properties directly, e.g. obj.x.",
  "use-isnan": "Use Number.isNaN(x). NaN is never equal to anything, even itself.",
  "valid-typeof": "typeof returns one of: 'string', 'number', 'boolean', 'undefined', 'object', 'function', 'symbol', 'bigint'.",
  "no-unsafe-negation": "Wrap the check in parentheses, e.g. !(key in obj).",
  "no-use-before-define": "Move the declaration above its first use. let/const variables cannot be used before their line runs.",
  "no-unused-vars": "Remove it if you do not need it, or use it. Unused code makes programs harder to read.",
  "no-var": "Use const for values that never change and let for ones that do. var is function-scoped and hoisted, which causes subtle bugs.",
  eqeqeq: "Use === / !== instead. == converts types first, so '1' == 1 and 0 == '' are both true.",
  "no-unreachable": "Code after return, throw, break or continue never runs. Move it earlier or delete it.",
  "no-self-assign": "Assigning a variable to itself does nothing. Did you mean to assign a different value?",
  "no-cond-assign": "Did you mean === ? A single = assigns instead of comparing.",
  "no-constant-condition": "The condition always has the same value, so the branch always (or never) runs.",
  "no-unused-expressions": "This expression does nothing on its own. Did you forget an assignment (count = count + 1) or the () of a function call?",
  "no-loop-func": "This function captures a variable that changes as the loop runs. Use let in the loop header or move the function out of the loop.",
  "array-callback-return": "Return a value from the callback (map/filter need one), or use forEach if you do not need a result.",
  "no-fallthrough": "Add break; at the end of the case, or a // falls through comment if it is intentional.",
  "no-unmodified-loop-condition": "Nothing inside the loop changes the condition, so it may run forever. Update the variable inside the loop.",
  "prefer-const": "It is never reassigned, so declare it with const. Readers then know the value stays the same.",
  "no-empty": "Add code to the block, or a comment explaining why it is empty.",
  "no-console": "Fine while debugging. Remove console.log calls once the code works.",
  "no-alert": "alert() freezes the page. Show messages in the page instead, e.g. with an element's textContent.",
  "game/no-document-write": "Create elements with document.createElement() and append them, or set an element's textContent.",
  "game/no-innerhtml-concat":
    "Mixing data into HTML strings can break the page (or let users inject HTML). Create elements with document.createElement() and set textContent.",
  "game/dom-query-in-loop": "Look the element up once before the loop and store it in a const.",
  "game/listener-in-loop":
    "Consider event delegation: one listener on the parent that checks event.target.closest(...). It also works for elements added later.",
  "game/unknown-id": "Check the spelling (ids are case-sensitive) or add that id to an element in the HTML tab.",
};

const PLAIN_INNERHTML_SUGGESTION = "Use textContent for plain text. It is faster and cannot accidentally inject HTML.";

const RULES: LinterNS.RulesRecord = {
  "no-undef": "error",
  "no-const-assign": "error",
  "no-dupe-keys": "error",
  "no-dupe-args": "error",
  "no-duplicate-case": "error",
  "no-redeclare": ["error", { builtinGlobals: false }],
  "no-func-assign": "error",
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-with": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  "no-unsafe-negation": "error",
  "no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
  "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
  "no-var": "warn",
  eqeqeq: ["warn", "always", { null: "ignore" }],
  "no-unreachable": "warn",
  "no-self-assign": "warn",
  "no-cond-assign": "warn",
  "no-constant-condition": "warn",
  "no-unused-expressions": ["warn", { allowShortCircuit: true, allowTernary: true }],
  "no-loop-func": "warn",
  "array-callback-return": "warn",
  "no-fallthrough": "warn",
  "no-unmodified-loop-condition": "warn",
  "prefer-const": "warn",
  "no-empty": "warn",
  "no-console": "warn",
  "no-alert": "warn",
  "game/no-document-write": "warn",
  "game/no-innerhtml-concat": "warn",
  "game/dom-query-in-loop": "warn",
  "game/listener-in-loop": "warn",
};

let linter: Linter | null = null;

function syntaxSuggestion(message: string): string {
  if (/Unterminated string/i.test(message)) return "Close the string with the same quote it started with (\" or ').";
  if (/Unterminated template/i.test(message)) return "Close the template literal with a backtick (`).";
  if (/Unterminated regular expression/i.test(message)) return "A stray / starts a regular expression. Check for a typo or a missing //.";
  if (/end of input|Unexpected token\s*$/i.test(message))
    return "Something is not closed. Count your { } ( ) [ ] pairs and make sure every one that opens also closes.";
  if (/has already been declared/i.test(message)) return "Declare each name once, then just assign to it (without let/const).";
  if (/Unexpected identifier/i.test(message))
    return "Two values or names are next to each other with nothing between them. Look for a missing comma, operator, dot or quote.";
  if (/Unexpected token/i.test(message))
    return "Check this spot and the end of the previous line for a missing or extra bracket, comma, quote or operator.";
  return "Check this line and the one before it for typos, missing brackets or quotes.";
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Suggest the closest-looking identifier from the code for a misspelled name. */
function didYouMean(name: string, js: string): string | null {
  const words = new Set(js.match(/[A-Za-z_$][\w$]*/g) ?? []);
  for (const g of ["document", "console", "window", "addEventListener", "getElementById", "querySelector"]) words.add(g);
  let best: string | null = null;
  let bestDist = Math.min(3, Math.floor(name.length / 2));
  for (const w of words) {
    if (w === name) continue;
    const d = w.toLowerCase() === name.toLowerCase() ? 0.5 : levenshtein(w, name);
    if (d <= bestDist) {
      best = w;
      bestDist = d;
    }
  }
  return best;
}

/** ids assigned from JS (el.id = "x", setAttribute("id", "x"), id="x" inside strings) count as existing. */
function idsCreatedInJs(js: string): string[] {
  const out: string[] = [];
  for (const m of js.matchAll(/\bid\s*=\s*\\?["'`]([\w-]+)/g)) out.push(m[1]);
  for (const m of js.matchAll(/setAttribute\(\s*["'`]id["'`]\s*,\s*["'`]([\w-]+)/g)) out.push(m[1]);
  return out;
}

export function analyzeJs(js: string, htmlIds: Set<string> = new Set()): Issue[] {
  if (!js.trim()) return [];
  linter ??= new Linter();
  const ids = [...htmlIds, ...idsCreatedInJs(js)];
  const config: LinterNS.Config = {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { ...globals.browser },
    },
    plugins: { game: { rules: gameRules } },
    rules: { ...RULES, "game/unknown-id": ["warn", { ids }] },
  };

  const messages = linter.verify(js, config);
  const issues: Issue[] = [];
  for (const m of messages) {
    const loc = { line: m.line, col: m.column, endLine: m.endLine, endCol: m.endColumn };
    if (m.fatal || !m.ruleId) {
      const message = m.message.replace(/^Parsing error:\s*/, "");
      issues.push({
        rule: "syntax",
        severity: "error",
        lang: "js",
        ...loc,
        message: `Syntax error: ${message}`,
        suggestion: syntaxSuggestion(message),
      });
      continue;
    }
    let suggestion = SUGGESTIONS[m.ruleId] ?? "";
    if (m.ruleId === "no-undef") {
      const name = /'([^']+)'/.exec(m.message)?.[1] ?? "";
      const guess = didYouMean(name, js);
      suggestion = guess
        ? `Did you mean \`${guess}\`? Otherwise declare it first, e.g. const ${name} = ...;`
        : `Declare it before using it, e.g. const ${name} = ...; or check the spelling.`;
    }
    if (m.ruleId === "game/no-innerhtml-concat" && m.message.startsWith("innerHTML used for plain text")) {
      suggestion = PLAIN_INNERHTML_SUGGESTION;
    }
    issues.push({
      rule: m.ruleId,
      severity: SEVERITY[m.ruleId] ?? (m.severity === 2 ? "error" : "warning"),
      lang: "js",
      ...loc,
      message: m.message,
      suggestion,
    });
  }
  return issues;
}
