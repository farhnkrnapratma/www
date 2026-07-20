export function autoResize(node: HTMLTextAreaElement, _val?: string) {
  const adjustHeight = () => {
    node.style.height = 'auto';
    // Use scrollHeight to set the height, adding a fallback just in case
    node.style.height = `${node.scrollHeight}px`;
  };

  node.addEventListener('input', adjustHeight);
  
  // Initial height adjustment
  const timer = setTimeout(adjustHeight, 0);

  return {
    update() {
      adjustHeight();
    },
    destroy() {
      node.removeEventListener('input', adjustHeight);
      clearTimeout(timer);
    }
  };
}
