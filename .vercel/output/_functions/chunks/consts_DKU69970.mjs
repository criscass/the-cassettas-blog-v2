import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function readingTime(html) {
  if (!html) return "0 min read";
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}
function formatSlug(id) {
  return id.replace(/\/index\.md$/, "").replace(/\.md$/, "").replace(/\/index\.mdx$/, "").replace(/\.mdx$/, "");
}
function cleanSlug(id) {
  const slug = formatSlug(id);
  return slug.replace(/^(it|en)\//, "");
}

const SITE = {
  TITLE: "The Cassetta's Reboot",
  DESCRIPTION: "A new life for the Cassetta's family",
  EMAIL: "cristiancassetta@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 5};
const HOME = {
  TITLE: "Home",
  DESCRIPTION: "The Cassetta's are going through a big change"
};
const BLOG = {
  TITLE: "Blog",
  DESCRIPTION: "Our adventures"
};

export { BLOG as B, HOME as H, SITE as S, cn as a, cleanSlug as c, readingTime as r };
