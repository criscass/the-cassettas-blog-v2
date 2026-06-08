import { eq, and, asc } from 'drizzle-orm';
import { d as db, u as user, c as comment } from '../../chunks/index_CLT99qYk.mjs';
import { i as isSupportedLanguage, c as canUserComment, v as validateCommentInput } from '../../chunks/comments_Bu447By1.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
const GET = async ({ url }) => {
  const postId = url.searchParams.get("postId");
  const language = url.searchParams.get("language");
  if (!postId) return json({ error: "Missing postId" }, 400);
  if (!isSupportedLanguage(language)) {
    return json({ error: "Invalid language" }, 400);
  }
  const rows = await db.select({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    authorName: user.name
  }).from(comment).innerJoin(user, eq(comment.userId, user.id)).where(and(eq(comment.postId, postId), eq(comment.language, language))).orderBy(asc(comment.createdAt));
  return json({ comments: rows });
};
const POST = async ({ request, locals }) => {
  const currentUser = locals.user;
  if (!currentUser) {
    return json({ error: "You must be signed in to comment" }, 401);
  }
  if (!canUserComment(currentUser)) {
    return json({ error: "Your account is not approved to comment" }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const result = validateCommentInput(body);
  if (!result.ok) {
    return json({ error: result.error }, 400);
  }
  const [created] = await db.insert(comment).values({
    postId: result.value.postId,
    language: result.value.language,
    content: result.value.content,
    userId: currentUser.id
  }).returning({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt
  });
  return json(
    { comment: { ...created, authorName: currentUser.name } },
    201
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
