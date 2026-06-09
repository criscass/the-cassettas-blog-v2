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
        className="rounded-xl border border-border bg-surface/60 px-4 py-3"
      >
        <h2 className="font-semibold">{t.pendingHeading}</h2>
        <p className="mt-1 text-sm opacity-70">
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
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
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
          className="rounded-lg border border-border bg-transparent px-3 py-2 focus:border-accent/50 focus:outline-none"
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
          className="rounded-lg border border-border bg-transparent px-3 py-2 focus:border-accent/50 focus:outline-none"
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
          className="rounded-lg border border-border bg-transparent px-3 py-2 focus:border-accent/50 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-ink transition-opacity disabled:opacity-60"
      >
        {loading ? t.submitting : t.signUpButton}
      </button>

      <div className="flex items-center gap-3 text-xs opacity-50">
        <span className="h-px flex-1 bg-border" />
        {t.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:border-accent/30 hover:bg-accent/5"
      >
        {t.googleButton}
      </button>
    </form>
  );
}
