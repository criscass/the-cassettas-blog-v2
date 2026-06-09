import { config, collection, fields } from '@keystatic/core';

// GitHub storage in production (commits posts to repo → triggers Vercel rebuild);
// local storage in dev (reads/writes files directly, no GitHub auth needed).
const storage = import.meta.env.PROD
  ? ({
      kind: 'github' as const,
      repo: { owner: 'criscass', name: 'the-cassettas-blog-v2' },
    })
  : ({ kind: 'local' as const });

const postSchema = (defaultLanguage: 'it' | 'en') => ({
  title: fields.slug({ name: { label: 'Title' } }),
  description: fields.text({ label: 'Description' }),
  date: fields.date({
    label: 'Date',
    defaultValue: { kind: 'today' },
  }),
  draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
  language: fields.text({ label: 'Language', defaultValue: defaultLanguage }),
  content: fields.document({
    label: 'Content',
    formatting: true,
    dividers: true,
    links: true,
    // Images are stored in public/uploads/ and served at /uploads/<filename>.
    // They won't go through Astro's image pipeline, but that's acceptable for
    // CMS-authored posts. Relative-path images in existing markdown still work.
    images: {
      directory: 'public/uploads',
      publicPath: '/uploads/',
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
