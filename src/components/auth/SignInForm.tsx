import { useState, type FormEvent } from "react";
import { signIn } from "@lib/auth-client";
import { AUTH_STRINGS, type AuthLang } from "./authStrings";

type Props = {
  lang: AuthLang;
};

export default function SignInForm({ lang }: Props) {
  const t = AUTH_STRINGS[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: `/${lang}`,
    });
    setLoading(false);
    if (error) {
      // Surface the approval-gate message (FORBIDDEN) or any other auth error.
      setError(error.message ?? t.genericError);
      return;
    }
    window.location.href = `/${lang}`;
  }

  async function handleGoogle() {
    setError(null);
    await signIn.social({ provider: "google", callbackURL: `/${lang}` });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t.email}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t.password}</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {loading ? t.submitting : t.signInButton}
      </button>

      <div className="flex items-center gap-3 text-xs text-black/50 dark:text-white/50">
        <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        {t.or}
        <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded-lg border border-black/15 px-4 py-2 font-medium dark:border-white/20"
      >
        {t.googleButton}
      </button>
    </form>
  );
}
