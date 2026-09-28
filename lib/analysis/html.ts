import type { Issue } from "../types";

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
]);
/** Elements whose end tag the HTML spec lets you omit. Leaving them open is legal but sloppy. */
const OPTIONAL_END = new Set([
  "li", "p", "td", "th", "tr", "thead", "tbody", "tfoot", "option", "dt", "dd", "html", "head", "body", "colgroup", "caption",
]);
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);
const DEPRECATED: Record<string, string> = {
  center: "Use CSS text-align: center instead.",
  font: "Use CSS (color, font-family, font-size) instead.",
  marquee: "Use CSS animations instead.",
  blink: "Use CSS animations instead.",
  big: "Use CSS font-size instead.",
  strike: "Use <s> or <del>, or CSS text-decoration.",
  tt: "Use <code> or CSS font-family: monospace.",
  acronym: "Use <abbr> instead.",
  frame: "Use <iframe> or normal page layout instead.",
  frameset: "Use normal page layout instead.",
  applet: "Use <object> or modern web APIs instead.",
  basefont: "Use CSS instead.",
  dir: "Use <ul> instead.",
};
const LABELLABLE_INPUT_EXCLUDED = new Set(["hidden", "submit", "button", "reset", "image"]);

export interface Tag {
  name: string;
  attrs: Record<string, string>;
  start: number;
  end: number;
  closing: boolean;
  selfClosing: boolean;
}

const TAG_RE =
  /<!--[\s\S]*?(?:-->|$)|<!DOCTYPE[^>]*>|<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/gi;
const ATTR_RE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

/** Tokenizes tags, skipping comments and the contents of raw-text elements like <script>. */
export function scanTags(html: string): Tag[] {
  const tags: Tag[] = [];
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(html))) {
    if (!m[2]) continue; // comment or doctype
    const name = m[2].toLowerCase();
    const closing = m[1] === "/";
    const attrs: Record<string, string> = {};
    if (!closing && m[3]) {
      ATTR_RE.lastIndex = 0;
      let a: RegExpExecArray | null;
      while ((a = ATTR_RE.exec(m[3]))) {
        attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
      }
    }
    const tag: Tag = { name, attrs, start: m.index, end: m.index + m[0].length, closing, selfClosing: m[4] === "/" };
    tags.push(tag);
    if (!closing && RAW_TEXT.has(name)) {
      const close = html.toLowerCase().indexOf(`</${name}`, tag.end);
      if (close === -1) break;
      TAG_RE.lastIndex = close;
    }
  }
  return tags;
}

export function lineIndex(src: string) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  return (offset: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: offset - starts[lo] + 1 };
  };
}

/** All ids declared in the HTML, used by the JS checks to spot typos in getElementById. */
export function collectIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const t of scanTags(html)) if (!t.closing && t.attrs.id) ids.add(t.attrs.id);
  return ids;
}

export function analyzeHtml(html: string): Issue[] {
  const issues: Issue[] = [];
  const pos = lineIndex(html);
  const tags = scanTags(html);

  const at = (tag: Tag) => {
    const s = pos(tag.start);
    const e = pos(tag.end);
    return { line: s.line, col: s.col, endLine: e.line, endCol: e.col };
  };
  const add = (tag: Tag, issue: Omit<Issue, "lang" | "line" | "col">) =>
    issues.push({ lang: "html", ...at(tag), ...issue });

  const stack: Tag[] = [];
  const ids = new Map<string, Tag>();
  const labelFor = new Set<string>();
  const formControls: { tag: Tag; insideLabel: boolean }[] = [];
  const inlineStyled: Tag[] = [];
  let lastHeading = 0;

  const reportUnclosed = (open: Tag, before?: Tag) => {
    const optional = OPTIONAL_END.has(open.name);
    add(open, {
      rule: "unclosed-tag",
      severity: optional ? "info" : "error",
      message: before
        ? `<${open.name}> is not closed before </${before.name}>.`
        : `<${open.name}> is never closed.`,
      suggestion: optional
        ? `Add </${open.name}> explicitly. Browsers guess where it ends, but being explicit avoids surprises.`
        : `Add </${open.name}> where the element should end. Tags must close in reverse order of opening.`,
    });
  };

  for (const tag of tags) {
    if (tag.closing) {
      if (VOID.has(tag.name)) {
        add(tag, {
          rule: "void-close",
          severity: "warning",
          message: `<${tag.name}> is a void element and never has a closing tag.`,
          suggestion: `Remove </${tag.name}>.`,
        });
        continue;
      }
      const idx = stack.map((t) => t.name).lastIndexOf(tag.name);
      if (idx === -1) {
        add(tag, {
          rule: "stray-close",
          severity: "error",
          message: `</${tag.name}> has no matching opening tag.`,
          suggestion: `Remove it, or add the missing <${tag.name}> before it.`,
        });
        continue;
      }
      for (let i = stack.length - 1; i > idx; i--) reportUnclosed(stack[i], tag);
      stack.length = idx;
      continue;
    }

    const { name, attrs } = tag;
    if (!VOID.has(name) && !tag.selfClosing) stack.push(tag);

    if (attrs.id !== undefined) {
      if (attrs.id.trim() === "") {
        add(tag, { rule: "empty-id", severity: "warning", message: "Empty id attribute.", suggestion: "Give it a unique name or remove it." });
      } else if (ids.has(attrs.id)) {
        add(tag, {
          rule: "duplicate-id",
          severity: "error",
          message: `The id "${attrs.id}" is used more than once (first on line ${at(ids.get(attrs.id)!).line}).`,
          suggestion: "ids must be unique. Use a class for shared styling, or rename one of them.",
        });
      } else {
        ids.set(attrs.id, tag);
      }
    }

    for (const attr of Object.keys(attrs)) {
      if (/^on[a-z]+$/.test(attr)) {
        add(tag, {
          rule: "inline-handler",
          severity: "warning",
          message: `Inline event handler ${attr}="..." on <${name}>.`,
          suggestion: `Give the element an id and use element.addEventListener("${attr.slice(2)}", handler) in the JS tab. It keeps HTML and behaviour separate.`,
        });
      }
    }

    if (attrs.style !== undefined) inlineStyled.push(tag);

    if (DEPRECATED[name]) {
      add(tag, { rule: "deprecated-tag", severity: "warning", message: `<${name}> is obsolete.`, suggestion: DEPRECATED[name] });
    }

    if (name === "img" && attrs.alt === undefined) {
      add(tag, {
        rule: "img-alt",
        severity: "warning",
        message: "<img> is missing an alt attribute.",
        suggestion: 'Describe the image with alt="...", or use alt="" if it is purely decorative.',
      });
    }

    if (name === "a" && attrs.href === undefined) {
      add(tag, {
        rule: "link-href",
        severity: "warning",
        message: "<a> without href is not a real link (it cannot be focused with the keyboard).",
        suggestion: 'Add href="...", or use a <button> if it triggers an action.',
      });
    }

    const heading = /^h([1-6])$/.exec(name);
    if (heading) {
      const level = Number(heading[1]);
      if (lastHeading && level > lastHeading + 1) {
        add(tag, {
          rule: "heading-skip",
          severity: "info",
          message: `Heading jumps from <h${lastHeading}> to <h${level}>.`,
          suggestion: `Use <h${lastHeading + 1}> so the outline has no gaps. Style it with CSS if you want it smaller.`,
        });
      }
      lastHeading = level;
    }

    if (name === "label" && attrs.for) labelFor.add(attrs.for);
    if (
      (name === "input" && !LABELLABLE_INPUT_EXCLUDED.has((attrs.type ?? "text").toLowerCase())) ||
      name === "textarea" ||
      name === "select"
    ) {
      formControls.push({ tag, insideLabel: stack.some((t) => t.name === "label") });
    }

    if (name === "script") {
      add(tag, {
        rule: "script-in-html",
        severity: "info",
        message: "<script> inside the HTML tab.",
        suggestion: "Put your JavaScript in the JS tab. It keeps the code organised and gets checked for errors.",
      });
    }
  }

  for (const open of stack) reportUnclosed(open);

  for (const { tag, insideLabel } of formControls) {
    const id = tag.attrs.id;
    const labelled = insideLabel || (id && labelFor.has(id)) || tag.attrs["aria-label"] || tag.attrs["aria-labelledby"];
    if (!labelled) {
      add(tag, {
        rule: "input-label",
        severity: "warning",
        message: `<${tag.name}> has no associated <label>.`,
        suggestion: id
          ? `Add <label for="${id}">...</label> so clicking the label focuses the field and screen readers announce it.`
          : 'Give it an id and add <label for="that-id">...</label>.',
      });
    }
  }

  if (inlineStyled.length >= 3) {
    add(inlineStyled[0], {
      rule: "inline-style",
      severity: "info",
      message: `${inlineStyled.length} elements use inline style="...".`,
      suggestion: "Move repeated styles into a <style> block with class selectors. It is easier to change later.",
    });
  }

  return issues;
}
