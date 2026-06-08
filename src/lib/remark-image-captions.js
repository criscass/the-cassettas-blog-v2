export default function remarkImageCaptions() {
  return (tree) => {
    const visit = (node, fn, parent = null) => {
      if (!node) return;
      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          fn(child, i, node);
          visit(child, fn, node);
        }
      }
    };

    visit(tree, (node, index, parent) => {
      if (!parent || node?.type !== 'image' || !node.title) return;

      const captionText = node.title;
      // Remove the title so it doesn't show as a tooltip
      node.title = null;

      const imageParagraph = {
        type: 'paragraph',
        children: [node],
      };

      const captionParagraph = {
        type: 'paragraph',
        children: [
          {
            type: 'emphasis',
            children: [{ type: 'text', value: captionText }],
          },
        ],
      };

      parent.children.splice(index, 1, imageParagraph, captionParagraph);
    });
  };
}
