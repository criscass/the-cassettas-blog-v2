import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "@lib/auth-client";
import { AUTH_STRINGS, type AuthLang } from "./authStrings";

type Props = {
  lang: AuthLang;
};

// First letters of up to two words, uppercased; falls back to the first char.
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function AuthStatus({ lang }: Props) {
  const t = AUTH_STRINGS[lang];
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    await signOut();
    window.location.href = `/${lang}`;
  }

  if (isPending) return null;

  if (!session?.user) {
    return (
      <a
        href={`/${lang}/sign-in`}
        className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm transition-colors duration-300 ease-in-out hover:border-accent/30 hover:bg-accent/5 hover:text-accent focus-visible:border-accent/30 focus-visible:bg-accent/5 focus-visible:text-accent"
      >
        {t.signInLink}
      </a>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={session.user.name}
        className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium transition-colors duration-300 ease-in-out hover:border-accent/30 hover:bg-accent/5 hover:text-accent focus-visible:border-accent/30 focus-visible:bg-accent/5 focus-visible:text-accent"
      >
        {getInitials(session.user.name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 flex w-48 flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm shadow-lg"
        >
          <span className="truncate opacity-70">{session.user.name}</span>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-left transition-colors duration-300 ease-in-out hover:border-accent/30 hover:bg-accent/5 hover:text-accent focus-visible:border-accent/30 focus-visible:bg-accent/5 focus-visible:text-accent"
          >
            {t.signOutButton}
          </button>
        </div>
      )}
    </div>
  );
}
