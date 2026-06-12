import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@lib/auth-client";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "@lib/form-validation";
import {
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
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (name.trim() === "") errors.name = t.errRequired;
    if (email.trim() === "") errors.email = t.errRequired;
    else if (!isValidEmail(email)) errors.email = t.errEmail;
    if (password === "") errors.password = t.errRequired;
    else if (password.length < PASSWORD_MIN_LENGTH)
      errors.password = t.errPasswordMin;
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
          aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
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
        <FieldError id="signup-password-error" message={fieldErrors.password} />
      </label>

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
