import { config, collection, fields } from '@keystatic/core';

// Local-first authoring: Keystatic always reads/writes files in the working
// directory (no GitHub auth needed). Posts are reviewed locally, then committed
// and pushed by hand — never committed straight to the repo by the live admin.
// (As a result the deployed /keystatic can't persist changes: the serverless
// filesystem is ephemeral. Author locally via `npm run dev`.)
const storage = { kind: 'local' as const };

const postSchema = (defaultLanguage: 'it' | 'en') => ({
  title: fields.slug({ name: { label: 'Title' } }),
  description: fields.text({ label: 'Description' }),
  date: fields.date({
    label: 'Date',
    defaultValue: { kind: 'today' },
  }),
  draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
  language: fields.text({ label: 'Language', defaultValue: defaultLanguage }),
  // `fields.mdx` with `extension: 'md'` writes plain `.md` files (Keystatic's
  // rich-text fields otherwise emit `.mdoc`/`.mdx`, which the Astro content
  // loader — globbing `**/*.{md,mdx}` — would only partly pick up). This keeps
  // CMS posts identical in shape to the hand-written `.md` posts.
  content: fields.mdx({
    label: 'Content',
    extension: 'md',
    options: {
      // No `directory`/`publicPath`: images are co-located next to the post's
      // index.md and referenced with a relative path, so they go through
      // Astro's image pipeline like the relative images in hand-written posts.
      image: {},
    },
  }),
});

export default config({
  storage,

  ui: {
    brand: { name: 'The Cassettas' },
    navigation: {
      'Italian Posts': ['blogIt'],
      'English Posts': ['blogEn'],
    },
  },

  collections: {
    blogIt: collection({
      label: 'Blog — IT',
      slugField: 'title',
      path: 'src/content/blog/it/*/index',
      format: { contentField: 'content' },
      schema: postSchema('it'),
    }),

    blogEn: collection({
      label: 'Blog — EN',
      slugField: 'title',
      path: 'src/content/blog/en/*/index',
      format: { contentField: 'content' },
      schema: postSchema('en'),
    }),
  },
});
