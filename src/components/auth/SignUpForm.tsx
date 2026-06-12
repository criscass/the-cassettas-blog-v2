import { useState, useEffect, type FormEvent } from "react";
import { signIn, signUp } from "@lib/auth-client";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "@lib/form-validation";
import {
  GOOGLE_NAME_COOKIE,
  INTRODUCTION_COOKIE,
  INTRODUCTION_COOKIE_MAX_AGE,
  INTRODUCTION_MIN_LENGTH,
  isValidIntroduction,
  normalizeIntroduction,
} from "@lib/introduction";
import { AUTH_STRINGS, type AuthLang } from "./authStrings";
import { FieldError, fieldInputClasses } from "./FieldError";

type Props = {
  lang: AuthLang;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  introduction?: string;
};

export default function SignUpForm({ lang }: Props) {
  const t = AUTH_STRINGS[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // Google mode shows a reduced form (name + introduction, no email/password)
  // whose submit launches the OAuth flow. Entered by clicking the Google
  // button, or via ?google=1 — where the sign-in page sends brand-new Google
  // users. Can't be a useState initializer: the island is prerendered, so
  // window only exists after hydration.
  const [googleMode, setGoogleMode] = useState(false);

  // Surface feedback from the Google OAuth redirect (handleGoogle passes this
  // page as errorCallbackURL): ACCOUNT_PENDING means the account WAS created
  // and is awaiting approval (a notice, not an error).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google")) setGoogleMode(true);
    const code = params.get("error");
    if (code === "ACCOUNT_PENDING") {
      setNotice(t.errAccountPending);
    } else if (code === "ACCOUNT_REJECTED") {
      setError(t.errAccountRejected);
    } else if (code === "INTRODUCTION_REQUIRED") {
      // Cookie missing/expired on the OAuth callback — back to Google mode.
      setGoogleMode(true);
      setError(t.introGoogleRequired);
    } else if (code) {
      const desc = params.get("error_description") || code;
      setError(decodeURIComponent(desc));
    }
  }, []);

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (name.trim() === "") errors.name = t.errRequired;
    if (!googleMode) {
      if (email.trim() === "") errors.email = t.errRequired;
      else if (!isValidEmail(email)) errors.email = t.errEmail;
      if (password === "") errors.password = t.errRequired;
      else if (password.length < PASSWORD_MIN_LENGTH)
        errors.password = t.errPasswordMin;
    }
    if (introduction.trim() === "") errors.introduction = t.errRequired;
    else if (!isValidIntroduction(introduction))
      errors.introduction = t.introError;
    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (googleMode) {
      await handleGoogle();
      return;
    }
    setLoading(true);
    const { error } = await signUp.email({
      name,
      email,
      password,
      introduction: normalizeIntroduction(introduction),
      // Where the emailed verification link lands the user after verifying.
      callbackURL: `/${lang}/sign-in?verified=1`,
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? t.genericError);
      return;
    }
    // autoSignIn is off and the account is `pending`, so there's no session.
    // Show the check-your-inbox / awaiting-approval notice instead.
    setDone(true);
  }

  // Submit of the Google-mode form (fields already validated). The user row is
  // created server-side in the OAuth callback, so the name and introduction
  // travel in short-lived cookies that the user-create hook reads back
  // (see src/lib/auth.ts).
  async function handleGoogle() {
    const cookieSuffix = `; path=/; max-age=${INTRODUCTION_COOKIE_MAX_AGE}; samesite=lax`;
    document.cookie = `${INTRODUCTION_COOKIE}=${encodeURIComponent(normalizeIntroduction(introduction))}${cookieSuffix}`;
    document.cookie = `${GOOGLE_NAME_COOKIE}=${encodeURIComponent(name.trim())}${cookieSuffix}`;
    setLoading(true);
    // Google creates the user, then the session-create hook blocks the session
    // for the new `pending` account — the user lands back here (?error=…),
    // where the effect above shows the awaiting-approval notice.
    await signIn.social({
      provider: "google",
      callbackURL: `/${lang}`,
      errorCallbackURL: `/${lang}/sign-up?google=1`,
    });
  }

  function switchMode(toGoogle: boolean) {
    setGoogleMode(toGoogle);
    setError(null);
    setNotice(null);
    setFieldErrors({});
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
        >
          {error}
        </p>
      )}

      {!error && notice && (
        <p
          role="status"
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm"
        >
          {notice}
        </p>
      )}

      {googleMode && <p className="text-sm opacity-70">{t.googleModeHelp}</p>}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t.name}</span>
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError("name");
          }}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "signup-name-error" : undefined}
          className={fieldInputClasses(Boolean(fieldErrors.name))}
        />
        <FieldError id="signup-name-error" message={fieldErrors.name} />
      </label>

      {!googleMode && (
        <>
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
                clearFieldError("email");
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "signup-email-error" : undefined
              }
              className={fieldInputClasses(Boolean(fieldErrors.email))}
            />
            <FieldError id="signup-email-error" message={fieldErrors.email} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t.password}</span>
            <input
              type="password"
              name="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "signup-password-error" : undefined
              }
              className={fieldInputClasses(Boolean(fieldErrors.password))}
            />
            <FieldError
              id="signup-password-error"
              message={fieldErrors.password}
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t.introLabel}</span>
        <span className="text-xs opacity-70">{t.introHelp}</span>
        <textarea
          name="introduction"
          required
          minLength={INTRODUCTION_MIN_LENGTH}
          rows={3}
          placeholder={t.introPlaceholder}
          value={introduction}
          onChange={(e) => {
            setIntroduction(e.target.value);
            clearFieldError("introduction");
          }}
          aria-invalid={Boolean(fieldErrors.introduction)}
          aria-describedby={
            fieldErrors.introduction ? "signup-introduction-error" : undefined
          }
          className={fieldInputClasses(Boolean(fieldErrors.introduction))}
        />
        <FieldError
          id="signup-introduction-error"
          message={fieldErrors.introduction}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-ink transition-opacity disabled:opacity-60"
      >
        {loading
          ? t.submitting
          : googleMode
            ? t.googleButton
            : t.signUpButton}
      </button>

      {googleMode ? (
        <button
          type="button"
          onClick={() => switchMode(false)}
          className="self-center text-sm underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent"
        >
          {t.useEmailInstead}
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3 text-xs opacity-50">
            <span className="h-px flex-1 bg-border" />
            {t.or}
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => switchMode(true)}
            className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:border-accent/30 hover:bg-accent/5"
          >
            {t.googleButton}
          </button>
        </>
      )}
    </form>
  );
}
