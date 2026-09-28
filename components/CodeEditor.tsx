"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type { Issue, Lang } from "@/lib/types";

type Monaco = Parameters<BeforeMount>[0];
type EditorInstance = Parameters<OnMount>[0];

const LANGUAGE: Record<Lang, string> = { html: "html", js: "javascript" };

const beforeMount: BeforeMount = (monaco) => {
  // Our own analyzer reports JS problems with friendlier messages; avoid duplicate squiggles.
  const ts = (monaco.languages as unknown as { typescript?: { javascriptDefaults?: { setDiagnosticsOptions(o: object): void } } })
    .typescript;
  ts?.javascriptDefaults?.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
};

const OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  scrollBeyondLastLine: false,
  tabSize: 2,
  automaticLayout: true,
  padding: { top: 8 },
  renderLineHighlight: "line" as const,
};

export function CodeEditor({
  lang,
  value,
  onChange,
  issues = [],
  readOnly = false,
  pathPrefix,
  jumpTo,
}: {
  lang: Lang;
  value: string;
  onChange?: (value: string) => void;
  issues?: Issue[];
  readOnly?: boolean;
  pathPrefix: string;
  jumpTo?: { line: number; col: number; nonce: number } | null;
}) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  // Monaco loads asynchronously and keeps the first onMount callback, so markers read the latest props from here.
  const latest = useRef({ issues, lang });

  const applyMarkers = () => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    const { issues, lang } = latest.current;
    const severity = {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
      info: monaco.MarkerSeverity.Info,
    };
    monaco.editor.setModelMarkers(
      model,
      "codemimic",
      issues
        .filter((i) => i.lang === lang)
        .map((i) => ({
          severity: severity[i.severity],
          message: i.suggestion ? `${i.message}\n💡 ${i.suggestion}` : i.message,
          startLineNumber: i.line,
          startColumn: i.col,
          endLineNumber: i.endLine ?? i.line,
          endColumn: (i.endLine ?? i.line) > i.line ? (i.endCol ?? 1) : Math.max(i.endCol ?? 0, i.col + 1),
        })),
    );
  };

  useEffect(() => {
    latest.current = { issues, lang };
    applyMarkers();
  }, [issues, lang]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !jumpTo) return;
    editor.revealLineInCenter(jumpTo.line);
    editor.setPosition({ lineNumber: jumpTo.line, column: jumpTo.col });
    editor.focus();
  }, [jumpTo]);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      path={`${pathPrefix}.${lang}`}
      language={LANGUAGE[lang]}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      beforeMount={beforeMount}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        applyMarkers();
      }}
      options={{ ...OPTIONS, readOnly, domReadOnly: readOnly }}
      loading={<div className="p-4 text-sm text-muted">Loading editor…</div>}
    />
  );
}
