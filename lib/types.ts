export type Severity = "error" | "warning" | "info";
export type Lang = "html" | "js";

export interface Issue {
  rule: string;
  severity: Severity;
  lang: Lang;
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
  message: string;
  suggestion: string;
}

export interface Code {
  html: string;
  js: string;
}

export type Step =
  | { action: "click"; selector: string }
  | { action: "type"; selector: string; value: string }
  | { action: "key"; selector: string; key: string };

export interface ChallengeTest {
  name: string;
  /** JS expression evaluated inside the sandbox after the interactions run. */
  check: string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  brief: string;
  hints: string[];
  reference: Code;
  starter: Code;
  interactions: Step[];
  tests: ChallengeTest[];
  betterSolution: Code & { notes: string[] };
}

/** Normalized DOM node produced inside the sandbox. */
export type SnapNode =
  | { k: "text"; v: string }
  | {
      k: "el";
      tag: string;
      id?: string;
      cls?: string[];
      attrs?: Record<string, string>;
      style?: Record<string, string>;
      children: SnapNode[];
    };

export interface TestResult {
  name: string;
  pass: boolean;
  error?: string;
}

export interface LogEntry {
  level: "log" | "info" | "warn" | "error";
  text: string;
}

export interface EvalResult {
  before: SnapNode[];
  after: SnapNode[];
  tests: TestResult[];
  logs: LogEntry[];
  errors: string[];
  timedOut?: boolean;
}

export interface ScoreBreakdown {
  output: number; // 0..1
  tests: number | null; // 0..1, null when the challenge has no tests
  quality: number; // 0..1
  closeness: number; // 0..1
}

export interface ScoreResult {
  points: number; // 0..1000
  percent: number; // 0..100
  stars: 0 | 1 | 2 | 3;
  breakdown: ScoreBreakdown;
}
