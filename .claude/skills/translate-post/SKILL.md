---
name: translate-post
description: Translate an Italian blog post into English. Given a post folder (e.g. post-00053), creates src/content/blog/en/<post>/index.md as an idiomatic English translation of the Italian src/content/blog/it/<post>/index.md, preserving all Markdown. Use when asked to translate a blog post to English.
---

# Translate a blog post (IT → EN)

Mirror an Italian post into its English counterpart. The Italian post is already
written at `src/content/blog/it/<post>/index.md`; this skill creates the matching
`src/content/blog/en/<post>/index.md` as an idiomatic English translation with
all Markdown preserved.

## Procedure

1. **Require a post argument.** Expect a post identifier, e.g. `post-00053`. A
   bare number is accepted and normalized: `53` or `00053` → `post-00053`
   (zero-pad to 5 digits). **If no argument is given, stop and ask which post to
   translate — do not guess.**

2. **Resolve paths.**
   - Source: `src/content/blog/it/<post>/index.md`. If it doesn't exist, stop
     and report that the Italian post wasn't found.
   - Target: `src/content/blog/en/<post>/index.md`. If it already exists, ask
     the user before overwriting.

3. **Read** the Italian `index.md`.

4. **Write the English `index.md`** by translating the source:
   - **Frontmatter:** translate `title` and `description`; keep `date` and
     `draft` exactly; set `language: "en"`. Keep the YAML quoting style
     identical to the source (double-quoted values).
   - **Body:** natural, idiomatic English that matches the tone of the existing
     EN posts — light rephrasing for flow, em-dashes welcome. Not word-for-word.
   - **Image alt text and the quoted `"caption"` title** inside each
     `![alt](path "caption")` and `[![alt](path "caption")](url)` are prose —
     translate them. (The caption renders as the italic line under the image.)

5. **Write** the target file with the Write tool (this creates the `en/<post>/`
   folder automatically). Do not copy or move any image files — images are
   shared assets referenced by the same relative path from both languages.

6. **Report** the created path (e.g. `src/content/blog/en/post-00053/index.md`)
   and a one-line summary. Do not run a build or `astro check` — the user
   reviews the diff and commits both folders by hand.

## Preservation rules (do not violate)

- Same folder name — only `it` → `en` changes in the path.
- **Image paths copied verbatim** (e.g. `../../../../assets/images/post-53/pic-1.jpg`)
  — they are shared assets; never rewrite or relocate them.
- Translate alt text and `"caption"` titles inside image/link syntax.
- Keep `date` and `draft`; flip `language` to `"en"`.
- Preserve every trailing line-break backslash `\`, every blank line, all link
  URLs, and the exact paragraph/image order and count. The English file must be
  the same Markdown structure as the Italian one — only the human-readable text
  changes.
