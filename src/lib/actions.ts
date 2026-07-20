export function autoResize(node: HTMLTextAreaElement, value?: string) {
  void value;

  const adjustHeight = () => {
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };

  node.addEventListener('input', adjustHeight);

  const timer = setTimeout(adjustHeight, 0);

  return {
    update(nextValue?: string) {
      void nextValue;
      adjustHeight();
    },
    destroy() {
      node.removeEventListener('input', adjustHeight);
      clearTimeout(timer);
    },
  };
}
