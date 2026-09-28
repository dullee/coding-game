import Image from "next/image";
import Link from "next/link";
import { challenges } from "@/lib/challenges";
import { challengeLeaderboard, globalLeaderboard, type LeaderRow } from "@/lib/leaderboard";
import { db } from "@/db";

export const dynamic = "force-dynamic";

function Player({ row }: { row: LeaderRow }) {
  return (
    <span className="flex items-center gap-2">
      {row.image ? (
        <Image src={row.image} alt="" width={20} height={20} className="rounded-full" />
      ) : (
        <span className="h-5 w-5 rounded-full bg-panel-2" />
      )}
      {row.name ?? "Anonymous"}
    </span>
  );
}

export default async function LeaderboardPage() {
  if (!db) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-muted">The leaderboard needs a database. Set DATABASE_URL.</main>;
  }
  const [global, perChallenge] = await Promise.all([
    globalLeaderboard(25),
    Promise.all(challenges.map(async (c) => ({ challenge: c, rows: await challengeLeaderboard(c.id, 5) }))),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">Overall score is the sum of each player&apos;s best score on every challenge.</p>

      <table className="mt-6 w-full max-w-2xl text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="py-2 pr-4 font-medium">#</th>
            <th className="py-2 pr-4 font-medium">Player</th>
            <th className="py-2 pr-4 text-right font-medium">Solved</th>
            <th className="py-2 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {global.length === 0 && (
            <tr><td colSpan={4} className="py-6 text-muted">No scores yet. Be the first!</td></tr>
          )}
          {global.map((row, i) => (
            <tr key={row.userId} className="border-t border-border">
              <td className="py-2 pr-4 font-mono text-muted">{i + 1}</td>
              <td className="py-2 pr-4"><Player row={row} /></td>
              <td className="py-2 pr-4 text-right font-mono">{row.solved}</td>
              <td className="py-2 text-right font-mono text-accent-strong">{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-12 text-lg font-semibold">Per challenge</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {perChallenge.map(({ challenge, rows }) => (
          <section key={challenge.id} className="rounded-lg border border-border bg-panel p-4">
            <Link href={`/play/${challenge.id}`} className="font-medium hover:text-accent-strong">{challenge.title}</Link>
            <ol className="mt-3 space-y-1.5 text-sm">
              {rows.length === 0 && <li className="text-muted">No scores yet</li>}
              {rows.map((row, i) => (
                <li key={row.userId} className="flex items-center gap-2">
                  <span className="w-4 font-mono text-muted">{i + 1}</span>
                  <Player row={row} />
                  <span className="ml-auto font-mono">{row.score}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
