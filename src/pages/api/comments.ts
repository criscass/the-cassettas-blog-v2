import type { APIRoute } from "astro";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@db/index";
import { comment, user } from "@db/schema";
import {
  canUserComment,
  isSupportedLanguage,
  validateCommentInput,
} from "@lib/comments";

// SSR — reads/writes the database per request.
export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/comments?postId=post-00042&language=it
// Returns the post's comments (oldest first) with the author's display name.
export const GET: APIRoute = async ({ url }) => {
  const postId = url.searchParams.get("postId");
  const language = url.searchParams.get("language");

  if (!postId) return json({ error: "Missing postId" }, 400);
  if (!isSupportedLanguage(language)) {
    return json({ error: "Invalid language" }, 400);
  }

  const rows = await db
    .select({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      authorName: user.name,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.postId, postId), eq(comment.language, language)))
    .orderBy(asc(comment.createdAt));

  return json({ comments: rows });
};

// POST /api/comments  body: { postId, language, content }
// Auth required; only approved users may write (see canUserComment).
export const POST: APIRoute = async ({ request, locals }) => {
  const currentUser = locals.user;
  if (!currentUser) {
    return json({ error: "You must be signed in to comment" }, 401);
  }
  if (!canUserComment(currentUser)) {
    return json({ error: "Your account is not approved to comment" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const result = validateCommentInput(body as Record<string, unknown>);
  if (!result.ok) {
    return json({ error: result.error }, 400);
  }

  const [created] = await db
    .insert(comment)
    .values({
      postId: result.value.postId,
      language: result.value.language,
      content: result.value.content,
      userId: currentUser.id,
    })
    .returning({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
    });

  return json(
    { comment: { ...created, authorName: currentUser.name } },
    201,
  );
};
