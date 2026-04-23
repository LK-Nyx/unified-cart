// @module uc-ui-item.js
// [UC:ui] Render d'un article de panier dans la sidebar Shadow DOM.
// Dépend de : UCUtils, UCPriceHistoryEngine, UCUIToast, UCCartManager, UCUI, UCLabels (via ctx.labelDefs)

const UCUIItem = (() => {
  const LOG = '[UC:ui-item]';

  const render = (item, domain, shadowRoot, ctx = {}) => {
    const el = document.createElement('div');
    el.className = 'uc-cart-item';
    el.dataset.itemId = item.id;
    el.dataset.domain = domain;

    const trendLabel = UCPriceHistoryEngine.trendLabel(item);
    const trendClass = trendLabel?.startsWith('↓') ? 'trend--down'
                     : trendLabel?.startsWith('↑') ? 'trend--up'
                     : 'trend--stable';

    const historyLines = (item.priceHistory ?? [])
      .slice(-5).reverse()
      .map(h => `${new Date(h.seenAt).toLocaleDateString('fr-FR')} : ${UCUtils.esc(item.currency ?? '€')}${h.price.toFixed(2)}`);
    const tooltip = historyLines.join('\n') || 'Pas d\'historique';

    const priceStr = `${item.currency ?? '€'}${(item.price ?? 0).toFixed(2)}`;
    const qty = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : '';
    const labelDefs = ctx.labelDefs ?? {};
    const itemLabels = item.labels ?? [];

    el.innerHTML = `
      <div class="uc-cart-item__main">
        <span class="uc-cart-item__name" title="${UCUtils.esc(item.name)}">${UCUtils.esc(item.name ?? '—')}</span>
        <span class="uc-cart-item__price">${UCUtils.esc(priceStr)}${UCUtils.esc(qty)}</span>
      </div>
      ${itemLabels.length ? `
        <div class="uc-label-badges">
          ${itemLabels.map(lid => {
            const def = labelDefs[lid];
            if (!def) return '';
            return `<span class="uc-label-badge" style="background:${UCUtils.esc(def.color ?? '#89b4fa')}">${UCUtils.esc(def.name)}</span>`;
          }).join('')}
        </div>` : ''}
      <div class="uc-cart-item__meta">
        ${trendLabel
          ? `<span class="uc-cart-item__trend ${trendClass}" title="${UCUtils.esc(tooltip)}">${UCUtils.esc(trendLabel)}</span>`
          : '<span class="uc-cart-item__trend trend--stable" style="opacity:.4">—</span>'
        }
        <div class="uc-cart-item__actions">
          ${item.url ? `<button class="uc-btn uc-btn--icon uc-btn--open" title="Ouvrir le produit">🔗</button>` : ''}
          <button class="uc-btn uc-btn--icon uc-btn--delete" title="Supprimer cet article">🗑</button>
        </div>
      </div>
    `;

    const btnOpen = el.querySelector('.uc-btn--open');
    if (btnOpen && item.url) {
      btnOpen.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          GM_openInTab(item.url, { active: true });
        } catch (err) {
          console.error(LOG, 'GM_openInTab échoué', err);
          UCUIToast.show(shadowRoot, 'Impossible d\'ouvrir le produit', 'error');
        }
      });
    }

    el.querySelector('.uc-btn--delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await UCCartManager.removeItem(domain, item.id);
        UCUIToast.show(shadowRoot, 'Article retiré', 'success');
        UCUI.load();
      } catch (err) {
        console.error(LOG, 'removeItem échoué', err);
        UCUIToast.show(shadowRoot, 'Erreur lors de la suppression', 'error');
      }
    });

    return el;
  };

  return { render };
})();
