# Code Mimic

A web coding game: each challenge shows a **reference page** (its rendered output and its HTML/JS source). You rebuild the same output in a live editor, and the game scores how close you got, flags errors and flaws as you type, and shows better ways to write it.

**Play it live: https://coding-game-pi-eight.vercel.app**

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npx drizzle-kit push         # create tables (already done for the bundled Neon DB)
npm run dev                  # http://localhost:3000
```

The game itself works without any configuration. Accounts, the leaderboard and AI review need:

| Variable | Needed for | How to get it |
|---|---|---|
| `DATABASE_URL` | scores, leaderboard, accounts | Neon Postgres connection string |
| `AUTH_SECRET` | sign-in | `npx auth secret` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | sign-in | GitHub → Settings → Developer settings → OAuth Apps → New. Callback URL: `http://localhost:3000/api/auth/callback/github` locally, or `https://coding-game-pi-eight.vercel.app/api/auth/callback/github` for the live site |
| `ANTHROPIC_API_KEY` | "Ask AI for review" (Claude Haiku 4.5, 20 reviews/user/day) | console.anthropic.com |

## How scoring works (0–1000 pts)

| Part | Weight | What it measures |
|---|---|---|
| Output match | 45% | Your rendered DOM vs the reference's: tags, ids, classes, key attributes, text and computed styles. For interactive challenges the same clicks/typing are replayed on both pages, and *what changed* counts most. |
| Behaviour tests | 25% | Challenge-specific checks (e.g. "counter shows 2 after +1 ×3, Reset, +1 ×2"). Static challenges fold this weight into output match. |
| Code quality | 20% | 100% minus penalties per issue (error 25, warning 8, tip 2, runtime error 15). A syntax error means 0. Scaled by output match, so clean empty code earns nothing. |
| Code closeness | 10% | Token similarity to the reference source. Kept small: other correct solutions are fine. |

★ ≥ 50%, ★★ ≥ 70%, ★★★ ≥ 90%. Your best score per challenge counts toward the leaderboard.

## Error detection

- **JS**: ESLint (run server-side at `/api/analyze`) with learner-friendly messages and fixes: syntax errors, undeclared variables (with "did you mean…?"), `var`, `==`, unused code, `eval`, unreachable code, and more. Custom rules cover `innerHTML` string-building, DOM lookups inside loops, `getElementById` with an id missing from your HTML, listeners added in loops, and `document.write`.
- **HTML**: unclosed or mismatched tags, stray closing tags, duplicate ids, `<img>` without `alt`, inputs without labels, inline `onclick=` handlers, obsolete tags, heading-level skips, and links without `href`.
- **Runtime**: console output and uncaught errors from your page, plus an infinite-loop guard that stops runaway loops after 1 second.
- After a check, each challenge shows an idiomatic **better solution** with notes. Signed-in players can also ask Claude for a personalised review.

## Adding a challenge

Add an entry to `lib/challenges.ts`: `reference` and `starter` code, `interactions` to replay (`click` / `type` / `key`), `tests` (JS expressions evaluated in the page), and a `betterSolution`. `npm test` checks that every reference and better solution passes the analyzer cleanly.

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm test`: unit tests for the analyzer, scoring and sandbox helpers (vitest)
- `npm run lint`

Note: output and test results are measured in the player's browser, so a determined player could forge a submission. The server recomputes code quality and closeness itself.
