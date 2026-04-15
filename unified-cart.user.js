// ==UserScript==
// @name         Unified Cart
// @namespace    unified-cart
// @version      1.0.0
// @description  Agrège vos paniers d'achat de tous les sites, 100% local et privé.
// @match        *://*/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_openInTab
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-constants.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-storage.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-price-history.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-cart-manager.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-watchlist.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-cart-page.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-generic.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-amazon.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-utils.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-ui-styles.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-ui-toast.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-ui-item.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-ui-list.js
// @require      file:///home/lararchfr/code/extensions-tampermonkey/uc-ui.js
// ==/UserScript==

// @module unified-cart.user.js
// [UC:main] Orchestrateur principal — userscript Tampermonkey.

(() => {
  // Sécurité : ignorer les iframes
  if (window.self !== window.top) return;

  const LOG = '[UC:main]';

  /** Retourne le domaine sans www. */
  const getDomain = () => window.location.hostname.replace(/^www\./, '');

  /** Sélectionne l'adaptateur selon le domaine. */
  const getAdapter = () => {
    const host = window.location.hostname;
    if (/amazon\.(fr|com|de|es|it|co\.uk|co\.jp|ca|com\.br|in|com\.mx|com\.au|nl|se|pl|sg)$/.test(host)) {
      return { name: 'amazon', fn: UCAdapters.amazon.extract };
    }
    return { name: 'generic', fn: UCGenericDetector.extract };
  };

  /** Lance le scan et met à jour le storage + l'UI. */
  const scan = async () => {
    const adapter = getAdapter();
    const domain = getDomain();
    const url = window.location.href;

    console.log(LOG, `Scan démarré sur ${url} [${adapter.name}]`);

    let items = [];
    try {
      items = adapter.fn();
    } catch (e) {
      console.error(LOG, `Adaptateur "${adapter.name}" a planté`, e);
    }

    if (items.length > 0) {
      console.log(LOG, `${items.length} article(s) trouvé(s)`);
      await UCCartManager.mergeCart(domain, items);
      await UCWatchlist.add(url, domain, adapter.name);
      UCUI.load();
    } else {
      console.log(LOG, 'Aucun article trouvé sur cette page');
      await UCWatchlist.updateLastScanned(url);
    }
  };

  // Exposer scan() pour que UCUI._onScan puisse l'appeler
  window._ucScan = scan;

  /** Initialisation : UI + détection auto. */
  const init = async () => {
    // Initialiser l'UI en premier
    try {
      await UCUI._init();
    } catch (e) {
      console.error(LOG, 'Échec initialisation UI', e);
    }

    const url = window.location.href;

    // Vérifier la watchlist
    let watchedPages = {};
    try {
      watchedPages = await UCWatchlist.getAll();
    } catch (e) {
      console.warn(LOG, 'Impossible de récupérer la watchlist', e);
    }

    if (watchedPages[url]) {
      console.log(LOG, 'URL dans watchlist → scan auto');
      scan();
    } else if (UCCartPageDetector.isCartPage()) {
      console.log(LOG, 'Page panier détectée → scan auto');
      scan();
    } else {
      console.log(LOG, 'Page ignorée (pas un panier, pas dans watchlist)');
    }
  };

  // SPA : re-init après navigation
  let _lastUrl = window.location.href;
  const _spaObserver = new MutationObserver(() => {
    const current = window.location.href;
    if (current !== _lastUrl) {
      _lastUrl = current;
      console.log(LOG, `Navigation SPA → ${current}`);
      setTimeout(init, 800);
    }
  });

  if (document.body) {
    _spaObserver.observe(document.body, { subtree: true, childList: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      _spaObserver.observe(document.body, { subtree: true, childList: true });
    });
  }

  // Lancer
  init();
})();
