import { signOut, useSession } from "@lib/auth-client";
import { AUTH_STRINGS, type AuthLang } from "./authStrings";

type Props = {
  lang: AuthLang;
};

export default function AuthStatus({ lang }: Props) {
  const t = AUTH_STRINGS[lang];
  const { data: session, isPending } = useSession();

  async function handleSignOut() {
    await signOut();
    window.location.href = `/${lang}`;
  }

  if (isPending) return null;

  if (!session?.user) {
    return (
      <a
        href={`/${lang}/sign-in`}
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs transition-colors duration-300 ease-in-out hover:border-accent/30 hover:bg-accent/5 hover:text-accent focus-visible:border-accent/30 focus-visible:bg-accent/5 focus-visible:text-accent"
      >
        {t.signInLink}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="max-w-[10rem] truncate opacity-70">
        {session.user.name}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-lg border border-border bg-surface px-2 py-1 transition-colors duration-300 ease-in-out hover:border-accent/30 hover:bg-accent/5 hover:text-accent focus-visible:border-accent/30 focus-visible:bg-accent/5 focus-visible:text-accent"
      >
        {t.signOutButton}
      </button>
    </div>
  );
}
