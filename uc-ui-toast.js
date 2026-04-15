// @module uc-ui-toast.js
// [UC:ui] Notifications toast dans le Shadow DOM.

const UCUIToast = (() => {
  /**
   * Affiche une notification dans le shadow root de la sidebar.
   * @param {ShadowRoot} shadowRoot
   * @param {string} message
   * @param {'info'|'success'|'error'} type
   * @param {number} duration ms (défaut 2000)
   */
  const show = (shadowRoot, message, type = 'info', duration = 2000) => {
    let container = shadowRoot.getElementById('uc-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'uc-toast-container';
      shadowRoot.querySelector('#uc-sidebar')?.appendChild(container);
    }
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `uc-toast uc-toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('uc-toast--visible'));
    });

    setTimeout(() => {
      toast.classList.remove('uc-toast--visible');
      const removeToast = () => toast.remove();
      setTimeout(removeToast, 500);
      toast.addEventListener('transitionend', removeToast, { once: true });
    }, duration);
  };

  return { show };
})();
