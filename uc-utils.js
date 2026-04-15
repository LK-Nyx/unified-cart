// @module uc-utils.js
// [UC:utils] Utilitaires partagés — XSS escaping.

const UCUtils = (() => {
  const esc = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  return { esc };
})();
