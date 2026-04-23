// @module uc-ui-list.js
// [UC:ui] Render d'une section de panier (un domaine) dans la sidebar Shadow DOM.
// Dépend de : UCUtils, UCUIItem, UCUIToast, UCCartManager, UCUI, UCLabels

const UCUIList = (() => {
  const LOG = '[UC:ui-list]';

  const renderSection = (domain, cart, shadowRoot, labelDefs = {}) => {
    const cartItems   = cart.items.filter(i => i.source === 'cart');
    const browseItems = cart.items.filter(i => i.source !== 'cart');

    const cartTotal   = cartItems.reduce((s, i) => s + ((i.price ?? 0) * (i.quantity ?? 1)), 0);
    const currency    = cart.items[0]?.currency ?? '€';
    const lastUpdated = cart.lastUpdated
      ? new Date(cart.lastUpdated).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '—';

    const countLabel  = cartItems.length > 0
      ? `${cartItems.length} article${cartItems.length > 1 ? 's' : ''}`
      : `${browseItems.length} consulté${browseItems.length > 1 ? 's' : ''}`;
    const totalLabel  = cartItems.length > 0
      ? `${UCUtils.esc(currency)}${cartTotal.toFixed(2)}`
      : '—';

    const section = document.createElement('div');
    section.className = 'uc-cart-section';
    section.dataset.domain = domain;

    section.innerHTML = `
      <div class="uc-cart-section__header" role="button" tabindex="0" aria-expanded="false">
        <span class="uc-cart-section__toggle" aria-hidden="true">▶</span>
        <span class="uc-cart-section__domain">${UCUtils.esc(domain)}</span>
        <span class="uc-cart-section__count">${countLabel}</span>
        <span class="uc-cart-section__total">${totalLabel}</span>
      </div>
      <div class="uc-cart-section__items" hidden></div>
      <div class="uc-cart-section__footer" hidden>
        <button class="uc-btn uc-btn--danger uc-btn--clear">Vider ce panier</button>
        <span class="uc-cart-section__updated">${UCUtils.esc(lastUpdated)}</span>
      </div>
    `;

    const domainLabels = UCLabels.getForDomain({ [domain]: cart }, domain);
    if (domainLabels.length) {
      const badgesEl = document.createElement('div');
      badgesEl.className = 'uc-label-badges';
      badgesEl.style.padding = '.15rem .75rem .25rem 2.2rem';
      for (const lid of domainLabels) {
        const def = labelDefs[lid];
        if (!def) continue;
        const badge = document.createElement('span');
        badge.className = 'uc-label-badge';
        badge.style.background = def.color ?? '#89b4fa';
        badge.textContent = def.name;
        badgesEl.appendChild(badge);
      }
      section.insertBefore(badgesEl, section.querySelector('.uc-cart-section__items'));
    }

    const header = section.querySelector('.uc-cart-section__header');
    const itemsContainer = section.querySelector('.uc-cart-section__items');
    const footer = section.querySelector('.uc-cart-section__footer');
    const toggle = section.querySelector('.uc-cart-section__toggle');

    const renderGroup = (items, label) => {
      if (label) {
        const lbl = document.createElement('div');
        lbl.className = 'uc-items-group__label';
        lbl.textContent = label;
        itemsContainer.appendChild(lbl);
      }
      for (const item of items) {
        itemsContainer.appendChild(UCUIItem.render(item, domain, shadowRoot, { labelDefs }));
      }
    };

    if (cartItems.length > 0) renderGroup(cartItems, browseItems.length > 0 ? 'Panier' : null);
    if (browseItems.length > 0) renderGroup(browseItems, 'Consultés');

    const toggleSection = () => {
      const isExpanded = !itemsContainer.hidden;
      itemsContainer.hidden = isExpanded;
      footer.hidden = isExpanded;
      toggle.textContent = isExpanded ? '▶' : '▼';
      header.setAttribute('aria-expanded', String(!isExpanded));
    };

    header.addEventListener('click', toggleSection);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(); }
    });

    const btnClear = section.querySelector('.uc-btn--clear');
    let clearPending = false;
    btnClear.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!clearPending) {
        clearPending = true;
        btnClear.textContent = 'Confirmer ?';
        setTimeout(() => {
          clearPending = false;
          btnClear.textContent = 'Vider ce panier';
        }, 3000);
        return;
      }
      try {
        await UCCartManager.clearCart(domain);
        UCUIToast.show(shadowRoot, `Panier ${UCUtils.esc(domain)} vidé`, 'success');
        UCUI.load();
      } catch (err) {
        console.error(LOG, 'clearCart échoué', err);
        UCUIToast.show(shadowRoot, 'Erreur lors du vidage', 'error');
      }
    });

    return section;
  };

  const renderFavoritesSection = (filteredCarts, favorites, labelDefs, shadowRoot) => {
    const favItems = [];
    for (const [domain, cart] of Object.entries(filteredCarts)) {
      for (const item of cart.items ?? []) {
        if (item.id in favorites) favItems.push({ item, domain });
      }
    }

    if (favItems.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'uc-cart-section uc-favorites-section';

    section.innerHTML = `
      <div class="uc-cart-section__header" role="button" tabindex="0" aria-expanded="false">
        <span class="uc-cart-section__toggle" aria-hidden="true">▶</span>
        <span class="uc-cart-section__domain">⭐ Favoris</span>
        <span class="uc-cart-section__count">${favItems.length} article${favItems.length > 1 ? 's' : ''}</span>
      </div>
      <div class="uc-cart-section__items" hidden></div>
    `;

    const header = section.querySelector('.uc-cart-section__header');
    const itemsContainer = section.querySelector('.uc-cart-section__items');
    const toggle = section.querySelector('.uc-cart-section__toggle');

    for (const { item, domain } of favItems) {
      itemsContainer.appendChild(UCUIItem.render(item, domain, shadowRoot, { labelDefs, favorites }));
    }

    const toggleSection = () => {
      const isExpanded = !itemsContainer.hidden;
      itemsContainer.hidden = isExpanded;
      toggle.textContent = isExpanded ? '▶' : '▼';
      header.setAttribute('aria-expanded', String(!isExpanded));
    };

    header.addEventListener('click', toggleSection);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(); }
    });

    return section;
  };

  return { renderSection, renderFavoritesSection };
})();
