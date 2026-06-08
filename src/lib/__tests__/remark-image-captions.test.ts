import { describe, expect, it } from 'vitest';
import remarkImageCaptions from '../remark-image-captions.js';

// Loosely-typed mdast fixtures — `any` keeps these tests readable without
// pulling in the full @types/mdast node unions.
function transform(tree: any) {
  remarkImageCaptions()(tree);
  return tree;
}

function imageParagraph(title: string | null) {
  return {
    type: 'paragraph',
    children: [{ type: 'image', url: './pic.jpg', alt: 'alt text', title }]
  };
}

describe('remarkImageCaptions', () => {
  // The plugin splices into the *immediate parent's* children — for a standalone
  // markdown image that's the wrapping `paragraph`, so the result is a paragraph
  // containing [imageParagraph, captionParagraph]. (Downstream HTML parsing then
  // flattens that invalid <p><p>/<p> nesting into sibling <p> tags at render time —
  // see the rendered output for post-00042's first image.)
  it('replaces the image with an image paragraph and an italic caption paragraph', () => {
    const tree = { type: 'root', children: [imageParagraph('A neat caption')] };

    transform(tree);

    const wrapper = tree.children[0];
    expect(wrapper.children).toHaveLength(2);

    const [imageNode, captionNode] = wrapper.children;
    expect(imageNode).toEqual({
      type: 'paragraph',
      children: [{ type: 'image', url: './pic.jpg', alt: 'alt text', title: null }]
    });
    expect(captionNode).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          children: [{ type: 'text', value: 'A neat caption' }]
        }
      ]
    });
  });

  it('clears the image title so it does not render as a tooltip', () => {
    const tree = { type: 'root', children: [imageParagraph('Caption text')] };

    transform(tree);

    const [imageParagraphNode] = tree.children[0].children as any[];
    expect(imageParagraphNode.children[0].title).toBeNull();
  });

  it('leaves images without a title untouched', () => {
    const tree = { type: 'root', children: [imageParagraph(null)] };

    transform(tree);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toEqual(imageParagraph(null));
  });

  it('leaves non-image nodes untouched', () => {
    const paragraph = { type: 'paragraph', children: [{ type: 'text', value: 'just text' }] };
    const tree = { type: 'root', children: [paragraph] };

    transform(tree);

    expect(tree).toEqual({ type: 'root', children: [paragraph] });
  });
});
