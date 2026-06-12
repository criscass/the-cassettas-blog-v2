import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@lib/auth-client";
import {
  canUserComment,
  COMMENT_MAX_LENGTH,
  type CommentLanguage,
} from "@lib/comments";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
};

type Props = {
  postId: string;
  lang: CommentLanguage;
};

const STRINGS = {
  it: {
    heading: "Commenti",
    empty: "Nessun commento. Scrivi il primo!",
    placeholder: "Scrivi un commento…",
    submit: "Pubblica",
    submitting: "Pubblicazione…",
    loading: "Caricamento commenti…",
    loadError: "Impossibile caricare i commenti.",
    postError: "Impossibile pubblicare il commento.",
    signInPrompt: "Accedi per lasciare un commento.",
    signInLink: "Accedi",
    pending: "Il tuo account è in attesa di approvazione per commentare.",
  },
  en: {
    heading: "Comments",
    empty: "No comments yet. Be the first!",
    placeholder: "Write a comment…",
    submit: "Post",
    submitting: "Posting…",
    loading: "Loading comments…",
    loadError: "Couldn't load comments.",
    postError: "Couldn't post your comment.",
    signInPrompt: "Sign in to leave a comment.",
    signInLink: "Sign in",
    pending: "Your account is awaiting approval before you can comment.",
  },
} as const;

function formatDate(iso: string, lang: CommentLanguage): string {
  const locale = lang === "it" ? "it-IT" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export default function CommentsSection({ postId, lang }: Props) {
  const t = STRINGS[lang];
  const { data: session, isPending: sessionPending } = useSession();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    const params = new URLSearchParams({ postId });
    fetch(`/api/comments?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then((data: { comments: Comment[] }) => {
        if (active) setComments(data.comments);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  const user = session?.user ?? null;
  const approved = canUserComment(user);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed === "") return;
    setSubmitting(true);
    setPostError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, language: lang, content: trimmed }),
      });
      if (!res.ok) throw new Error("post failed");
      const data: { comment: Comment } = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setContent("");
    } catch {
      setPostError(t.postError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="not-prose mt-16 space-y-6">
      <h2 className="text-xl font-semibold">
        {t.heading}
      </h2>

      {loading ? (
        <p className="text-sm opacity-60">{t.loading}</p>
      ) : loadError ? (
        <p className="text-sm text-rose-700 dark:text-rose-300">{t.loadError}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm opacity-60">{t.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-surface/40 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">
                  {c.authorName}
                </span>
                <time
                  dateTime={c.createdAt}
                  className="text-xs opacity-50"
                >
                  {formatDate(c.createdAt, lang)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {sessionPending ? null : approved ? (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          {postError && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {postError}
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.placeholder}
            maxLength={COMMENT_MAX_LENGTH}
            rows={4}
            required
            className="rounded-xl border border-border bg-transparent px-3 py-2 focus:border-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || content.trim() === ""}
            className="self-start rounded-lg bg-accent px-4 py-2 font-medium text-ink transition-opacity disabled:opacity-60"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </form>
      ) : user ? (
        <p className="text-sm opacity-60">{t.pending}</p>
      ) : (
        <p className="text-sm opacity-60">
          {t.signInPrompt}{" "}
          <a
            href={`/${lang}/sign-in`}
            className="text-accent underline underline-offset-4 hover:decoration-accent decoration-accent/50"
          >
            {t.signInLink}
          </a>
        </p>
      )}
    </section>
  );
}
