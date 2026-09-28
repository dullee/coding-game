/**
 * Script injected at the top of every sandboxed page. It captures console output and errors,
 * provides the loop guard (__cmG), and answers `evaluate` requests from the parent with a
 * normalized DOM snapshot, interaction replay and test results.
 *
 * Kept as a plain string so it is shipped verbatim into the iframe (no bundler rewriting).
 * `__JS_LINE_OFFSET__` is replaced with the number of lines preceding the user's script.
 */
export const HARNESS_SOURCE = String.raw`(function () {
  "use strict";
  var JS_LINE_OFFSET = __JS_LINE_OFFSET__;
  var parentWin = window.parent;
  var logs = [];
  var errors = [];

  function post(msg) {
    msg.__codemimic = true;
    try { parentWin.postMessage(msg, "*"); } catch (e) {}
  }

  function fmt(v) {
    try {
      if (typeof v === "string") return v;
      if (v instanceof Element) return "<" + v.tagName.toLowerCase() + (v.id ? "#" + v.id : "") + ">";
      if (v instanceof Error) return v.name + ": " + v.message;
      if (v === undefined) return "undefined";
      if (typeof v === "function") return "ƒ " + (v.name || "anonymous") + "()";
      var s = JSON.stringify(v);
      return s === undefined ? String(v) : s;
    } catch (e) { return String(v); }
  }

  ["log", "info", "warn", "error"].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      var text = Array.prototype.map.call(arguments, fmt).join(" ");
      if (logs.length < 500) logs.push({ level: level, text: text });
      post({ type: "log", level: level, text: text });
      if (orig) orig.apply(console, arguments);
    };
  });

  function reportError(text) {
    if (errors.length < 50) errors.push(text);
    post({ type: "runtime-error", text: text });
  }

  window.addEventListener("error", function (e) {
    var line = e.lineno ? e.lineno - JS_LINE_OFFSET : 0;
    reportError((e.message || "Error") + (line > 0 ? " (JS line " + line + ")" : ""));
  });
  window.addEventListener("unhandledrejection", function (e) {
    reportError("Unhandled promise rejection: " + fmt(e.reason));
  });

  // Loop guard: inserted into every loop body. Resets after each synchronous run (microtask).
  var guardStart = 0, guardCount = 0, guardArmed = false;
  Object.defineProperty(window, "__cmG", {
    value: function () {
      if (!guardArmed) {
        guardArmed = true;
        guardStart = Date.now();
        guardCount = 0;
        Promise.resolve().then(function () { guardArmed = false; });
      }
      if ((++guardCount & 1023) === 0 && Date.now() - guardStart > 1000) {
        throw new RangeError("Possible infinite loop: a loop ran for more than 1 second and was stopped.");
      }
    },
  });

  var ATTRS = ["type", "href", "src", "alt", "for", "placeholder", "name", "maxlength", "minlength", "required",
    "disabled", "colspan", "rowspan", "scope", "role", "aria-label", "aria-pressed", "title", "width", "height"];
  var INHERITED = ["color", "font-size", "font-weight", "font-style", "text-align"];
  var OWN_DEFAULTS = {
    "background-color": "rgba(0, 0, 0, 0)",
    "border-top-width": "0px",
    "border-top-left-radius": "0px",
    "padding-top": "0px",
    "text-decoration-line": "none",
    "list-style-type": null
  };
  var LAYOUT_DISPLAYS = { none: 1, flex: 1, grid: 1, "inline-flex": 1, "inline-grid": 1 };

  function styleOf(el) {
    var cs = getComputedStyle(el);
    var ps = el.parentElement ? getComputedStyle(el.parentElement) : null;
    var out = {};
    INHERITED.forEach(function (p) {
      var v = cs.getPropertyValue(p);
      if (!ps || ps.getPropertyValue(p) !== v) out[p] = v;
    });
    Object.keys(OWN_DEFAULTS).forEach(function (p) {
      var v = cs.getPropertyValue(p);
      if (OWN_DEFAULTS[p] === null ? (ps && ps.getPropertyValue(p) !== v) : v !== OWN_DEFAULTS[p]) out[p] = v;
    });
    var d = cs.getPropertyValue("display");
    if (LAYOUT_DISPLAYS[d]) out.display = d;
    return out;
  }

  function snap(node) {
    var out = [];
    node.childNodes.forEach(function (c) {
      if (c.nodeType === 3) {
        var v = c.textContent.replace(/\s+/g, " ").trim();
        if (v) out.push({ k: "text", v: v });
        return;
      }
      if (c.nodeType !== 1) return;
      var tag = c.tagName.toLowerCase();
      if (tag === "head" || tag === "script" || tag === "style" || tag === "template" || tag === "noscript") return;
      var n = { k: "el", tag: tag, children: [] };
      if (c.id) n.id = c.id;
      var cls = Array.prototype.slice.call(c.classList).sort();
      if (cls.length) n.cls = cls;
      var attrs = {};
      ATTRS.forEach(function (a) {
        if (c.hasAttribute(a)) attrs[a] = a === "src" ? "(set)" : c.getAttribute(a);
      });
      if (tag === "input" || tag === "textarea" || tag === "select") attrs.value = c.value;
      if (tag === "input" && (c.type === "checkbox" || c.type === "radio")) attrs.checked = String(c.checked);
      if (Object.keys(attrs).length) n.attrs = attrs;
      var style = styleOf(c);
      if (Object.keys(style).length) n.style = style;
      n.children = tag === "textarea" ? [] : snap(c);
      out.push(n);
    });
    return out;
  }

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function runStep(step) {
    var el = document.querySelector(step.selector);
    if (!el) {
      logs.push({ level: "warn", text: "Interaction skipped: nothing matches " + step.selector });
      return;
    }
    if (step.action === "click") {
      el.click();
    } else if (step.action === "type") {
      if (el.focus) el.focus();
      el.value = step.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (step.action === "key") {
      el.dispatchEvent(new KeyboardEvent("keydown", { key: step.key, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keyup", { key: step.key, bubbles: true }));
    }
  }

  async function evaluate(req) {
    var before = snap(document.documentElement);
    for (var i = 0; i < req.interactions.length; i++) {
      try { runStep(req.interactions[i]); } catch (e) { reportError(fmt(e)); }
      await tick();
    }
    var after = snap(document.documentElement);
    var tests = req.tests.map(function (t) {
      try {
        return { name: t.name, pass: !!new Function("return (" + t.check + ");")() };
      } catch (e) {
        return { name: t.name, pass: false, error: fmt(e) };
      }
    });
    return { before: before, after: after, tests: tests, logs: logs.slice(), errors: errors.slice() };
  }

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (e.source !== parentWin || !d || d.__codemimic !== true || d.type !== "evaluate") return;
    evaluate(d).then(function (result) {
      post({ type: "result", runId: d.runId, result: result });
    });
  });

  // Registered first on window, so it runs after the page's own submit handlers. A real submission
  // would navigate the sandbox away and lose the page, so block it and tell the player.
  window.addEventListener("submit", function (e) {
    if (e.defaultPrevented) return;
    e.preventDefault();
    var text = "A form was submitted without event.preventDefault(), so a real page would reload here.";
    logs.push({ level: "warn", text: text });
    post({ type: "log", level: "warn", text: text });
  });

  window.addEventListener("load", function () { post({ type: "ready" }); });
})();`;
