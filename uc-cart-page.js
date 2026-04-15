// @module detectors/cart-page.js
// [UC:cart-page] Détecte si la page courante est une page panier/checkout.
// Retourne un boolean. Ne modifie jamais le DOM.
// _testOverride() permet d'injecter un contexte simulé dans les tests.

const UCCartPageDetector = (() => {
  const LOG = '[UC:cart-page]';

  const URL_PATTERNS = [
    '/cart', '/basket', '/checkout', '/panier', '/bag',
    '/commande', '/order', '/wishlist', '/mon-panier',
    '/purchase', '/buy', '/korb', '/warenkorb',
  ];

  const TITLE_PATTERNS = [
    'panier', 'cart', 'basket', 'checkout', 'bag',
    'mon panier', 'your cart', 'my bag', 'shopping bag',
  ];

  const DOM_SELECTORS = [
    '[data-cart]', '[data-cart-count]', '.cart-container', '#cart',
    '#shopping-cart', 'form[action*="/cart"]', '[class*="shopping-cart"]',
    '[id*="shopping-cart"]', 'form[action*="/basket"]', '[data-testid*="cart"]',
  ];

  const IGNORED_PREFIXES = [
    'about:', 'chrome:', 'chrome-extension:', 'moz-extension:', 'data:', 'javascript:',
  ];

  let _override = null;
  const _testOverride = (ctx) => { _override = ctx; };
  const _getCtx = () => _override ?? {
    href: window.location.href,
    pathname: window.location.pathname,
    title: document.title,
  };

  const isCartPage = () => {
    const ctx = _getCtx();
    if (IGNORED_PREFIXES.some(p => ctx.href.startsWith(p))) return false;

    const path = ctx.pathname.toLowerCase();
    const title = ctx.title.toLowerCase();

    if (URL_PATTERNS.some(p => path.includes(p))) {
      console.log(LOG, `Panier détecté via URL : ${ctx.pathname}`);
      return true;
    }

    if (TITLE_PATTERNS.some(p => title.includes(p))) {
      console.log(LOG, `Panier détecté via titre : "${ctx.title}"`);
      return true;
    }

    if (!_override) {
      for (const sel of DOM_SELECTORS) {
        try {
          if (document.querySelector(sel)) {
            console.log(LOG, `Panier détecté via sélecteur : ${sel}`);
            return true;
          }
        } catch { /* Sélecteur invalide — ignorer */ }
      }
    }

    return false;
  };

  return { isCartPage, _testOverride };
})();
