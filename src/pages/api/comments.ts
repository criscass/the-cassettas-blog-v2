import type { APIRoute } from "astro";
import { asc, eq } from "drizzle-orm";
import { db } from "@db/index";
import { comment, user } from "@db/schema";
import { canUserComment, validateCommentInput } from "@lib/comments";
import { isAdmin } from "@lib/admin";
import { newCommentEmail, sendAdminNotification } from "@lib/notifications";
import { createRateLimiter } from "@lib/rate-limit";

// SSR — reads/writes the database per request.
export const prerender = false;

// Per-user comment throttle (see the serverless caveat in @lib/rate-limit).
const isRateLimited = createRateLimiter(10, 10 * 60 * 1000); // 10 per 10 minutes

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/comments?postId=post-00042
// Returns the post's comments (oldest first) with the author's display name.
// Posts share their id across languages, so comments are shown on both the
// IT and EN version regardless of which one they were written on.
export const GET: APIRoute = async ({ url }) => {
  const postId = url.searchParams.get("postId");

  if (!postId) return json({ error: "Missing postId" }, 400);

  const rows = await db
    .select({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      authorName: user.name,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(eq(comment.postId, postId))
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
  if (isRateLimited(currentUser.id)) {
    return json({ error: "Too many comments — please try again later." }, 429);
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

  // Tell the admin — unless the admin is the one commenting. Never throws.
  if (!isAdmin(currentUser)) {
    await sendAdminNotification(
      newCommentEmail(
        {
          authorName: currentUser.name,
          postId: result.value.postId,
          language: result.value.language,
          content: result.value.content,
        },
        new URL(request.url).origin,
      ),
    );
  }

  return json(
    { comment: { ...created, authorName: currentUser.name } },
    201,
  );
};
