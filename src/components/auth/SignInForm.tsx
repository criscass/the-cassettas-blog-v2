import { useState, useEffect, type FormEvent } from "react";
import { signIn } from "@lib/auth-client";
import { isValidEmail } from "@lib/form-validation";
import { AUTH_STRINGS, type AuthLang } from "./authStrings";
import { FieldError, fieldInputClasses } from "./FieldError";

type Props = {
  lang: AuthLang;
};

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function SignInForm({ lang }: Props) {
  const t = AUTH_STRINGS[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show errors sent back via ?error_description= after a failed OAuth redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const desc = params.get("error_description") || params.get("error");
    if (desc) setError(decodeURIComponent(desc));
  }, []);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (email.trim() === "") errors.email = t.errRequired;
    else if (!isValidEmail(email)) errors.email = t.errEmail;
    if (password === "") errors.password = t.errRequired;
    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
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
    await signIn.social({
      provider: "google",
      callbackURL: `/${lang}`,
      errorCallbackURL: `/${lang}/sign-in`,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
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
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "signin-email-error" : undefined}
          className={fieldInputClasses(Boolean(fieldErrors.email))}
        />
        <FieldError id="signin-email-error" message={fieldErrors.email} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t.password}</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "signin-password-error" : undefined
          }
          className={fieldInputClasses(Boolean(fieldErrors.password))}
        />
        <FieldError id="signin-password-error" message={fieldErrors.password} />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-ink transition-opacity disabled:opacity-60"
      >
        {loading ? t.submitting : t.signInButton}
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
