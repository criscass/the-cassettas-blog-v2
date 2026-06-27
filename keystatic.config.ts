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
      image: {
        // Store uploads beside the post's index.md, referenced relatively, so
        // they go through Astro's image pipeline like hand-written posts.
        //
        // `directory` (NOT `publicPath`) is what controls the on-disk location:
        // Keystatic writes the binary to `{directory}/{slug}/{filename}` — and
        // since the collection path is `src/content/blog/{lang}/*/index`, the
        // slug is the post folder, so this lands the file right next to
        // index.md. Leaving `publicPath` unset keeps the markdown reference a
        // bare `pic-1.jpg` (a relative path Astro resolves against index.md).
        //
        // Omitting `directory` is the trap: Keystatic then nests the upload
        // under the path's trailing `index` segment + field key, i.e.
        // `{slug}/index/content/pic-1.jpg`, which the bare reference can't find
        // → `[ImageNotFound] Could not find requested image pic-1.jpg`.
        directory: `src/content/blog/${defaultLanguage}`,
        // Keystatic's image dialog shows an "Alt text" field by default but
        // hides the markdown `title` attribute unless a schema field is given
        // for it. We surface it as "Caption" because remark-image-captions.js
        // turns an image's title into an italic caption line underneath it —
        // the same role the hand-written posts' quoted title string played.
        schema: {
          title: fields.text({ label: 'Caption (optional)' }),
        },
      },
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
