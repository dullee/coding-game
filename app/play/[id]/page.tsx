import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth, authConfigured } from "@/auth";
import { challenges, getChallenge } from "@/lib/challenges";
import { bestScoreFor } from "@/lib/leaderboard";
import GameLoader from "@/components/GameLoader";

export async function generateMetadata({ params }: PageProps<"/play/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `${getChallenge(id)?.title ?? "Challenge"} · Code Mimic` };
}

export default async function PlayPage({ params }: PageProps<"/play/[id]">) {
  const { id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) notFound();

  const session = authConfigured ? await auth() : null;
  const userId = session?.user?.id;
  const best = userId ? await bestScoreFor(userId, id) : null;
  const index = challenges.findIndex((c) => c.id === id);

  return (
    <GameLoader
      challenge={challenge}
      signedIn={!!userId}
      aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
      initialBest={best}
      nextId={challenges[index + 1]?.id ?? null}
    />
  );
}
