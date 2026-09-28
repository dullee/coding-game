import Image from "next/image";
import { auth, authConfigured, signIn, signOut } from "@/auth";

export async function AuthButton() {
  if (!authConfigured) {
    return <span className="hidden text-xs text-muted sm:inline" title="Set DATABASE_URL, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET">Accounts not configured</span>;
  }
  const session = await auth();
  if (!session?.user) {
    return (
      <form action={async () => { "use server"; await signIn("github"); }}>
        <button className="btn-ghost" type="submit">Sign in with GitHub</button>
      </form>
    );
  }
  return (
    <form className="flex items-center gap-3" action={async () => { "use server"; await signOut(); }}>
      {session.user.image && (
        <Image src={session.user.image} alt="" width={24} height={24} className="rounded-full" />
      )}
      <span className="text-sm">{session.user.name}</span>
      <button className="text-xs text-muted hover:text-foreground" type="submit">Sign out</button>
    </form>
  );
}
