// @module uc-ui.js
// [UC:ui] Shadow DOM : bouton flottant draggable + sidebar.
// Dépend de : UC_KEYS, UCStorage, UCCartManager, UCUIItem, UCUIList, UCUIToast, UCUtils, UC_UI_STYLES

const UCUI = (() => {
  const LOG = '[UC:ui]';
  let _root = null;
  let _shadow = null;
  let _abortController = null;

  // ── Init Shadow DOM ──
  const _init = async () => {
    if (document.getElementById('uc-root')) return;

    if (_abortController) _abortController.abort();
    _abortController = new AbortController();
    const signal = _abortController.signal;

    _root = document.createElement('div');
    _root.id = 'uc-root';
    _root.style.cssText = 'display:block!important;position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;pointer-events:none!important;z-index:2147483647!important;overflow:visible!important;';
    document.body.appendChild(_root);
    _shadow = _root.attachShadow({ mode: 'open' });

    // Injecter les styles
    const style = document.createElement('style');
    style.textContent = '.uc-sidebar--hidden { display: none !important; }\n' + UC_UI_STYLES;
    _shadow.appendChild(style);

    // FAB
    const fab = document.createElement('button');
    fab.id = 'uc-fab';
    fab.textContent = '🛒';
    fab.title = 'Unified Cart';
    _shadow.appendChild(fab);

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'uc-sidebar';
    sidebar.classList.add('uc-sidebar--hidden');
    sidebar.innerHTML = `
      <div class="uc-header">
        <span class="uc-header__title">🛒 Unified Cart</span>
        <div class="uc-header__actions">
          <button id="uc-btn-export" class="uc-btn uc-btn--icon" title="Exporter JSON">↓</button>
          <button id="uc-btn-import" class="uc-btn uc-btn--icon" title="Importer JSON">↑</button>
          <input type="file" id="uc-import-input" accept=".json" style="display:none">
          <button id="uc-btn-side" class="uc-btn uc-btn--icon" title="Changer de côté">◀</button>
          <button id="uc-btn-close" class="uc-btn uc-btn--icon" title="Fermer">✕</button>
        </div>
      </div>
      <div class="uc-total-bar">Total : <span id="uc-grand-total">—</span></div>
      <div id="uc-carts" class="uc-carts"></div>
      <div class="uc-footer">
        <button id="uc-btn-scan" class="uc-btn uc-btn--primary">Scanner cette page</button>
        <button id="uc-btn-add-manual" class="uc-btn uc-btn--secondary">Ajouter manuellement</button>
        <button id="uc-btn-clear-all" class="uc-btn uc-btn--danger" title="Vider tous les paniers">Tout vider</button>
      </div>
      <div id="uc-manual-form" class="uc-manual-form" hidden>
        <p class="uc-manual-form__title">Ajouter un article</p>
        <input class="uc-input" id="uc-manual-name" placeholder="Nom du produit *" type="text">
        <input class="uc-input" id="uc-manual-price" placeholder="Prix (ex : 29.99) *" type="text">
        <input class="uc-input" id="uc-manual-url" placeholder="URL du produit" type="text">
        <input class="uc-input" id="uc-manual-domain" placeholder="Domaine (optionnel)" type="text">
        <div class="uc-manual-form__actions">
          <button class="uc-btn uc-btn--primary" id="uc-manual-submit">Ajouter</button>
          <button class="uc-btn uc-btn--secondary" id="uc-manual-cancel">Annuler</button>
        </div>
      </div>
    `;
    _shadow.appendChild(sidebar);

    // Charger préférences position FAB et côté
    const [btnPos, side] = await Promise.all([
      UCStorage.get(UC_KEYS.BTN_POS),
      UCStorage.get(UC_KEYS.SIDE),
    ]);

    if (btnPos) {
      fab.style.bottom = 'auto';
      fab.style.right = 'auto';
      fab.style.left = btnPos.x + 'px';
      fab.style.top = btnPos.y + 'px';
    }

    if (side === 'left') sidebar.classList.add('uc-side--left');

    // ── FAB draggable ──
    let _dragging = false;
    let _dragStartX = 0, _dragStartY = 0;
    let _fabStartX = 0, _fabStartY = 0;
    let _moved = false;

    fab.addEventListener('mousedown', (e) => {
      _dragging = true;
      _moved = false;
      _dragStartX = e.clientX;
      _dragStartY = e.clientY;
      const rect = fab.getBoundingClientRect();
      _fabStartX = rect.left;
      _fabStartY = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!_dragging) return;
      const dx = e.clientX - _dragStartX;
      const dy = e.clientY - _dragStartY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) _moved = true;
      if (_moved) {
        const x = _fabStartX + dx;
        const y = _fabStartY + dy;
        fab.style.bottom = 'auto';
        fab.style.right = 'auto';
        fab.style.left = x + 'px';
        fab.style.top = y + 'px';
      }
    }, { signal });

    document.addEventListener('mouseup', async (e) => {
      if (!_dragging) return;
      _dragging = false;
      if (!_moved) {
        _toggle();
      } else {
        const x = parseFloat(fab.style.left);
        const y = parseFloat(fab.style.top);
        await UCStorage.set(UC_KEYS.BTN_POS, { x, y });
      }
    }, { signal });

    // ── Escape ferme la sidebar ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') sidebar.classList.add('uc-sidebar--hidden');
    }, { signal });

    // ── Bouton côté ──
    _shadow.getElementById('uc-btn-side').addEventListener('click', async () => {
      const isLeft = sidebar.classList.toggle('uc-side--left');
      _shadow.getElementById('uc-btn-side').textContent = isLeft ? '▶' : '◀';
      await UCStorage.set(UC_KEYS.SIDE, isLeft ? 'left' : 'right');
    });

    // ── Fermer ──
    _shadow.getElementById('uc-btn-close').addEventListener('click', _toggle);

    // ── Tout vider ──
    let clearAllPending = false;
    const btnClearAll = _shadow.getElementById('uc-btn-clear-all');
    btnClearAll.addEventListener('click', async () => {
      if (!clearAllPending) {
        clearAllPending = true;
        btnClearAll.textContent = 'Confirmer ?';
        setTimeout(() => {
          clearAllPending = false;
          btnClearAll.textContent = 'Tout vider';
        }, 3000);
        return;
      }
      clearAllPending = false;
      btnClearAll.textContent = 'Tout vider';
      try {
        await UCStorage.set(UC_KEYS.CARTS, {});
        UCUIToast.show(_shadow, 'Tous les paniers vidés', 'success');
        load();
      } catch (err) {
        console.error(LOG, 'clearAll échoué', err);
        UCUIToast.show(_shadow, 'Erreur lors du vidage', 'error');
      }
    });

    // ── Export ──
    _shadow.getElementById('uc-btn-export').addEventListener('click', _onExport);

    // ── Import ──
    let importPending = false;
    const btnImport = _shadow.getElementById('uc-btn-import');
    const importInput = _shadow.getElementById('uc-import-input');

    btnImport.addEventListener('click', () => {
      if (!importPending) {
        importPending = true;
        btnImport.title = 'Confirmer ? (écrase toutes les données)';
        btnImport.classList.add('uc-btn--danger');
        setTimeout(() => {
          importPending = false;
          btnImport.title = 'Importer JSON';
          btnImport.classList.remove('uc-btn--danger');
        }, 3000);
        return;
      }
      importPending = false;
      btnImport.title = 'Importer JSON';
      btnImport.classList.remove('uc-btn--danger');
      importInput.click();
    });

    importInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data !== 'object' || data === null || typeof data.carts !== 'object' || data.carts === null)
          throw new Error('Format invalide — clé "carts" manquante');
        for (const [d, cart] of Object.entries(data.carts)) {
          if (!Array.isArray(cart?.items))
            throw new Error(`Format invalide — panier "${d}" sans tableau items`);
        }
        await UCStorage.set(UC_KEYS.CARTS, data.carts);
        const count = Object.values(data.carts).reduce((s, c) => s + (c.items?.length ?? 0), 0);
        UCUIToast.show(_shadow, `Import réussi : ${count} article(s)`, 'success');
        load();
      } catch (err) {
        const userMsg = err instanceof SyntaxError ? 'Fichier JSON invalide' : err.message;
        UCUIToast.show(_shadow, `Erreur import : ${userMsg}`, 'error');
      }
      importInput.value = '';
    });

    // ── Scanner ──
    _shadow.getElementById('uc-btn-scan').addEventListener('click', _onScan);

    // ── Ajout manuel ──
    _shadow.getElementById('uc-btn-add-manual').addEventListener('click', () => {
      const form = _shadow.getElementById('uc-manual-form');
      form.hidden = !form.hidden;
    });

    _shadow.getElementById('uc-manual-cancel').addEventListener('click', () => {
      _shadow.getElementById('uc-manual-form').hidden = true;
    });

    _shadow.getElementById('uc-manual-submit').addEventListener('click', async () => {
      const name = _shadow.getElementById('uc-manual-name').value.trim();
      const priceStr = _shadow.getElementById('uc-manual-price').value.trim();
      const url = _shadow.getElementById('uc-manual-url').value.trim();
      const domainInput = _shadow.getElementById('uc-manual-domain').value.trim();

      let domain = domainInput;
      if (!domain && url) {
        try { domain = new URL(url).hostname.replace(/^www\./, ''); }
        catch {}
      }

      if (!name || !priceStr || !domain) {
        UCUIToast.show(_shadow, 'Nom, prix et domaine sont requis', 'error');
        return;
      }

      const price = parseFloat(priceStr.replace(',', '.'));
      if (isNaN(price) || price <= 0) {
        UCUIToast.show(_shadow, 'Prix invalide', 'error');
        return;
      }

      try {
        await UCCartManager.mergeCart(domain, [{ name, price, currency: '€', url: url || null, quantity: 1 }]);
        _shadow.getElementById('uc-manual-form').hidden = true;
        ['uc-manual-name', 'uc-manual-price', 'uc-manual-url', 'uc-manual-domain']
          .forEach(id => { _shadow.getElementById(id).value = ''; });
        UCUIToast.show(_shadow, 'Article ajouté', 'success');
        load();
      } catch (err) {
        console.error(LOG, 'mergeCart échoué', err);
        UCUIToast.show(_shadow, 'Erreur lors de l\'ajout', 'error');
      }
    });

    // Chargement initial
    await load();
    console.log(LOG, 'UI initialisée');
  };

  // ── Toggle sidebar ──
  const _toggle = () => {
    if (!_shadow) return;
    const sidebar = _shadow.getElementById('uc-sidebar');
    sidebar.classList.toggle('uc-sidebar--hidden');
  };

  // ── Scanner ──
  const _onScan = async () => {
    if (typeof window._ucScan === 'function') {
      UCUIToast.show(_shadow, 'Scan en cours...', 'info');
      await window._ucScan();
    } else {
      UCUIToast.show(_shadow, 'Scanner non disponible', 'error');
    }
  };

  // ── Export ──
  const _onExport = async () => {
    try {
      const carts = await UCCartManager.getAllCarts();
      const data = { carts, exportedAt: new Date().toISOString() };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unified-cart-${new Date().toISOString().slice(0, 10)}.json`;
      _shadow.appendChild(a);
      a.click();
      _shadow.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      UCUIToast.show(_shadow, 'Export téléchargé', 'success');
    } catch (err) {
      console.error(LOG, 'Export échoué', err);
      UCUIToast.show(_shadow, 'Erreur export', 'error');
    }
  };

  // ── Render ──
  const _render = (carts) => {
    if (!_shadow) return;
    const cartsEl = _shadow.getElementById('uc-carts');
    const grandTotalEl = _shadow.getElementById('uc-grand-total');
    if (!cartsEl || !grandTotalEl) return;

    cartsEl.innerHTML = '';
    const domains = Object.keys(carts ?? {}).filter(d => carts[d]?.items?.length > 0);

    if (domains.length === 0) {
      cartsEl.innerHTML = '<p class="uc-empty">Aucun panier enregistré.<br>Naviguez vers une page panier et cliquez "Scanner".</p>';
      grandTotalEl.textContent = '—';
      return;
    }

    let grandTotal = 0;
    const currencies = new Set();

    for (const domain of domains.sort()) {
      const cart = carts[domain];
      cartsEl.appendChild(UCUIList.renderSection(domain, cart, _shadow));
      grandTotal += cart.items.filter(i => i.source === 'cart').reduce((s, i) => s + ((i.price ?? 0) * (i.quantity ?? 1)), 0);
      cart.items.filter(i => i.source === 'cart').forEach(i => { if (i.currency) currencies.add(i.currency); });
    }

    if (currencies.size > 1) {
      grandTotalEl.textContent = `Multi-devises (${grandTotal.toFixed(2)})`;
    } else {
      const currency = currencies.size === 1 ? [...currencies][0] : '€';
      grandTotalEl.textContent = `${currency}${grandTotal.toFixed(2)}`;
    }
  };

  // ── Load ──
  const load = async () => {
    try {
      const carts = await UCCartManager.getAllCarts();
      _render(carts);
    } catch (err) {
      console.error(LOG, 'Erreur chargement', err);
      if (_shadow) {
        const cartsEl = _shadow.getElementById('uc-carts');
        if (cartsEl) cartsEl.innerHTML = '<p class="uc-error">Erreur de chargement des données.</p>';
      }
    }
  };

  return { load, _init, _toggle, _onScan };
})();
