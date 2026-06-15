import { useState, type FormEvent } from "react";
import { fieldInputClasses } from "@components/auth/FieldError";
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  HONEYPOT_FIELD,
} from "@lib/contact";

type Props = {
  lang: "it" | "en";
};

const STRINGS = {
  it: {
    name: "Nome",
    email: "Email",
    message: "Messaggio",
    placeholder: "Scrivi il tuo messaggio…",
    submit: "Invia",
    submitting: "Invio…",
    success: "Grazie! Il tuo messaggio è stato inviato.",
    error: "Impossibile inviare il messaggio. Riprova.",
  },
  en: {
    name: "Name",
    email: "Email",
    message: "Message",
    placeholder: "Write your message…",
    submit: "Send",
    submitting: "Sending…",
    success: "Thanks! Your message has been sent.",
    error: "Couldn't send your message. Please try again.",
  },
} as const;

export default function ContactForm({ lang }: Props) {
  const t = STRINGS[lang];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="not-prose rounded-xl border border-border bg-surface/40 p-4 text-sm">
        {t.success}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="not-prose flex flex-col gap-4"
    >
      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
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
          maxLength={CONTACT_NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldInputClasses(false)}
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
          className={fieldInputClasses(false)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t.message}</span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={CONTACT_MESSAGE_MAX_LENGTH}
          placeholder={t.placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={fieldInputClasses(false)}
        />
      </label>

      {/* Honeypot: hidden from real users, bots tend to fill it. */}
      <div aria-hidden="true" className="hidden">
        <label>
          {HONEYPOT_FIELD}
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-lg bg-accent px-4 py-2 font-medium text-ink transition-opacity disabled:opacity-60"
      >
        {submitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}
