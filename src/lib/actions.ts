export function autoResize(node: HTMLTextAreaElement, value?: string) {
  void value;

  const adjustHeight = () => {
    if (!node) return;
    node.style.height = 'auto';
    if (node.scrollHeight > 0) {
      node.style.height = `${node.scrollHeight}px`;
    }
  };

  node.addEventListener('input', adjustHeight);
  node.addEventListener('change', adjustHeight);

  // Initial height calculation on next animation frame & post-render timers
  requestAnimationFrame(adjustHeight);
  const timer1 = setTimeout(adjustHeight, 0);
  const timer2 = setTimeout(adjustHeight, 100);

  // Automatically recalculate height when element becomes visible in modals/dialogs
  const resizeObserver = new ResizeObserver(() => {
    adjustHeight();
  });
  resizeObserver.observe(node);

  return {
    update(nextValue?: string) {
      void nextValue;
      requestAnimationFrame(adjustHeight);
      setTimeout(adjustHeight, 0);
    },
    destroy() {
      node.removeEventListener('input', adjustHeight);
      node.removeEventListener('change', adjustHeight);
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
    },
  };
}
