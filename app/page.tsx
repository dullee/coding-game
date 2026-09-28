import Link from "next/link";
import { auth, authConfigured } from "@/auth";
import { challenges } from "@/lib/challenges";
import { bestScoresForUser } from "@/lib/leaderboard";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Stars, starsFor } from "@/components/Stars";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = authConfigured ? await auth() : null;
  const best = session?.user?.id ? await bestScoresForUser(session.user.id) : {};
  const total = Object.values(best).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Recreate the page. Beat the score.</h1>
        <p className="mt-3 text-muted">
          Each challenge shows a reference page and its code. Rebuild the same output with your own HTML and JavaScript.
          You are scored on how closely your output matches, whether it behaves correctly, and how clean your code is,
          and you get tips for writing it better.
        </p>
        {session?.user && (
          <p className="mt-4 text-sm">
            Your total: <span className="font-mono text-accent-strong">{total}</span>
            <span className="text-muted"> / {challenges.length * 1000} pts</span>
          </p>
        )}
      </section>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c, i) => {
          const score = best[c.id];
          return (
            <li key={c.id}>
              <Link
                href={`/play/${c.id}`}
                className="flex h-full flex-col rounded-lg border border-border bg-panel p-4 transition-colors hover:border-accent"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="font-medium">{c.title}</h2>
                  <span className="ml-auto"><DifficultyBadge level={c.difficulty} /></span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{c.brief}</p>
                <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                  {score !== undefined ? (
                    <>
                      <Stars count={starsFor(score)} />
                      <span className="font-mono text-muted">{score} pts</span>
                    </>
                  ) : (
                    <span className="text-muted">Not attempted</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
