/** Length of the longest common subsequence, O(n*m) time, O(m) memory. */
export function lcsLength<T>(a: T[], b: T[]): number {
  if (!a.length || !b.length) return 0;
  const row = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Dice-style similarity in [0, 1] based on LCS: 2·LCS / (|a| + |b|). */
export function sequenceSimilarity<T>(a: T[], b: T[], cap = 3000): number {
  if (!a.length && !b.length) return 1;
  const x = a.slice(0, cap);
  const y = b.slice(0, cap);
  return (2 * lcsLength(x, y)) / (x.length + y.length);
}

/** Splits source code into identifier / number / string / punctuation tokens, ignoring whitespace and comments. */
export function tokenizeCode(src: string): string[] {
  const stripped = src
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1");
  return stripped.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[A-Za-z_$][\w$-]*|\d+(?:\.\d+)?|===|!==|=>|[^\s\w]/g) ?? [];
}

/** Quotes are normalized so "x" and 'x' count as the same token. */
export function codeSimilarity(a: string, b: string): number {
  const norm = (t: string) => (/^['"`]/.test(t) ? `"${t.slice(1, -1)}"` : t);
  return sequenceSimilarity(tokenizeCode(a).map(norm), tokenizeCode(b).map(norm));
}
