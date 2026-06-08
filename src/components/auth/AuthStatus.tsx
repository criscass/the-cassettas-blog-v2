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
        className="rounded border border-black/15 bg-neutral-100 px-2 py-1 text-xs transition-colors duration-300 ease-in-out hover:bg-black/5 hover:text-black focus-visible:bg-black/5 focus-visible:text-black dark:border-white/20 dark:bg-neutral-900 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:bg-white/5 dark:focus-visible:text-white"
      >
        {t.signInLink}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="max-w-[10rem] truncate text-black/70 dark:text-white/70">
        {session.user.name}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded border border-black/15 bg-neutral-100 px-2 py-1 transition-colors duration-300 ease-in-out hover:bg-black/5 hover:text-black focus-visible:bg-black/5 focus-visible:text-black dark:border-white/20 dark:bg-neutral-900 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:bg-white/5 dark:focus-visible:text-white"
      >
        {t.signOutButton}
      </button>
    </div>
  );
}
