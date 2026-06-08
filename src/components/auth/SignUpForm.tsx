import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@lib/auth-client";
import { AUTH_STRINGS, type AuthLang } from "./authStrings";

type Props = {
  lang: AuthLang;
};

export default function SignUpForm({ lang }: Props) {
  const t = AUTH_STRINGS[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? t.genericError);
      return;
    }
    // autoSignIn is off and the account is `pending`, so there's no session.
    // Show the awaiting-approval notice instead of redirecting.
    setDone(true);
  }

  async function handleGoogle() {
    setError(null);
    // Google creates the user, then the session-create hook blocks the session
    // for the new `pending` account — the user lands back with the gate message.
    await signIn.social({ provider: "google", callbackURL: `/${lang}` });
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-lg border border-black/15 bg-black/5 px-4 py-3 dark:border-white/20 dark:bg-white/5"
      >
        <h2 className="font-semibold">{t.pendingHeading}</h2>
        <p className="mt-1 text-sm text-black/70 dark:text-white/70">
          {t.pendingBody}
        </p>
      </div>
    );
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
        <span className="font-medium">{t.name}</span>
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

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
          minLength={8}
          autoComplete="new-password"
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
        {loading ? t.submitting : t.signUpButton}
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
