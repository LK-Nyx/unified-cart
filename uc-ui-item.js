// @module uc-ui-item.js
// [UC:ui] Render d'un article de panier dans la sidebar Shadow DOM.
// Dépend de : UCUtils, UCPriceHistoryEngine, UCUIToast, UCCartManager, UCFavorites, UCPriceChart, UCUI

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
    const isFav = ctx.favorites ? (item.id in ctx.favorites) : false;
    const hasHistory = (item.priceHistory ?? []).length >= 2;

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
          ${hasHistory ? `<button class="uc-btn uc-btn--fav uc-btn--chart" title="Historique des prix">📈</button>` : ''}
          <button class="uc-btn uc-btn--fav uc-btn--label" title="Gérer les labels">🏷</button>
          <button class="uc-btn uc-btn--fav uc-btn--toggle-fav ${isFav ? 'uc-btn--fav--active' : ''}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${isFav ? '⭐' : '☆'}</button>
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

    // ── Bouton favori ──
    const btnFav = el.querySelector('.uc-btn--toggle-fav');
    if (btnFav) {
      btnFav.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const currently = item.id in (ctx.favorites ?? {});
          if (currently) {
            await UCFavorites.remove(item.id);
            UCUIToast.show(shadowRoot, 'Retiré des favoris', 'info');
          } else {
            await UCFavorites.add(item.id, domain, null);
            UCUIToast.show(shadowRoot, 'Ajouté aux favoris ⭐', 'success');
          }
          UCUI.load();
        } catch (err) {
          console.error(LOG, 'Favori échoué', err);
          UCUIToast.show(shadowRoot, 'Erreur favoris', 'error');
        }
      });
    }

    // ── Seuil d'alerte (si favori) ──
    if (isFav) {
      const settingsBtn = document.createElement('button');
      settingsBtn.className = 'uc-btn uc-btn--fav';
      settingsBtn.title = 'Seuil d\'alerte prix';
      settingsBtn.textContent = '⚙';
      settingsBtn.style.fontSize = '11px';
      el.querySelector('.uc-cart-item__actions').insertBefore(settingsBtn, el.querySelector('.uc-btn--toggle-fav'));

      let popoverEl = null;
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (popoverEl) { popoverEl.remove(); popoverEl = null; return; }
        const currentThreshold = ctx.favorites?.[item.id]?.alertThreshold ?? '';
        popoverEl = document.createElement('div');
        popoverEl.className = 'uc-threshold-popover';
        popoverEl.innerHTML = `
          <div class="uc-threshold-popover__row">
            <span>Alerter si baisse &gt;</span>
            <input class="uc-threshold-popover__input" type="number" min="0" max="100" placeholder="%" value="${currentThreshold}">
            <span>%</span>
          </div>
          <div class="uc-threshold-popover__actions">
            <button class="uc-btn uc-btn--primary uc-btn--save-threshold" style="font-size:11px;padding:.2rem .5rem">Sauvegarder</button>
            <button class="uc-btn uc-btn--secondary uc-btn--cancel-threshold" style="font-size:11px;padding:.2rem .5rem">Annuler</button>
          </div>
        `;
        el.appendChild(popoverEl);

        popoverEl.querySelector('.uc-btn--save-threshold').addEventListener('click', async () => {
          const val = popoverEl.querySelector('input').value;
          const pct = val === '' ? null : parseFloat(val);
          await UCFavorites.setThreshold(item.id, pct);
          popoverEl.remove(); popoverEl = null;
          UCUIToast.show(shadowRoot, 'Seuil enregistré', 'success');
          UCUI.load();
        });

        popoverEl.querySelector('.uc-btn--cancel-threshold').addEventListener('click', () => {
          popoverEl.remove(); popoverEl = null;
        });
      });
    }

    // ── Historique des prix (bouton 📈 + clic sur le titre) ──
    if (hasHistory) {
      let chartPanel = null;
      const toggleChart = (e) => {
        e?.stopPropagation();
        if (chartPanel) { chartPanel.remove(); chartPanel = null; return; }
        chartPanel = document.createElement('div');
        chartPanel.className = 'uc-chart-panel';

        const header = document.createElement('div');
        header.className = 'uc-chart-panel__header';
        header.innerHTML = `<button class="uc-chart-panel__back" title="Fermer">←</button><span>${UCUtils.esc(item.name)}</span>`;
        header.querySelector('.uc-chart-panel__back').addEventListener('click', (ev) => {
          ev.stopPropagation();
          chartPanel.remove();
          chartPanel = null;
        });

        const prices = (item.priceHistory ?? []).map(h => h.price);
        const stats = document.createElement('div');
        stats.className = 'uc-chart-panel__stats';
        stats.textContent = `Min ${item.currency ?? '€'}${Math.min(...prices).toFixed(2)} · Max ${item.currency ?? '€'}${Math.max(...prices).toFixed(2)} · ${prices.length} point${prices.length > 1 ? 's' : ''}`;

        chartPanel.appendChild(header);
        chartPanel.appendChild(UCPriceChart.renderFull(item));
        chartPanel.appendChild(stats);
        el.appendChild(chartPanel);
      };

      const btnChart = el.querySelector('.uc-btn--chart');
      if (btnChart) btnChart.addEventListener('click', toggleChart);

      const mainZone = el.querySelector('.uc-cart-item__main');
      mainZone.style.cursor = 'pointer';
      mainZone.title = 'Voir l\'historique des prix';
      mainZone.addEventListener('click', toggleChart);
    }

    // ── Bouton labels 🏷 ──
    const btnLabelEl = el.querySelector('.uc-btn--label');
    if (btnLabelEl) {
      let labelPopover = null;
      btnLabelEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (labelPopover) { labelPopover.remove(); labelPopover = null; return; }

        const allDefs = ctx.labelDefs ?? {};
        const currentLabels = new Set(item.labels ?? []);

        labelPopover = document.createElement('div');
        labelPopover.className = 'uc-threshold-popover uc-label-popover';

        if (Object.keys(allDefs).length === 0) {
          labelPopover.innerHTML = '<p style="font-size:11px;color:var(--muted)">Aucun label disponible.</p>';
        } else {
          for (const [lid, def] of Object.entries(allDefs)) {
            const row = document.createElement('label');
            row.className = 'uc-label-popover__row';
            row.innerHTML = `
              <input type="checkbox" data-lid="${UCUtils.esc(lid)}" ${currentLabels.has(lid) ? 'checked' : ''}>
              <span class="uc-label-badge" style="background:${UCUtils.esc(def.color ?? '#89b4fa')}">${UCUtils.esc(def.name)}</span>
            `;
            labelPopover.appendChild(row);
          }

          const saveBtn = document.createElement('button');
          saveBtn.className = 'uc-btn uc-btn--primary';
          saveBtn.style.cssText = 'font-size:11px;padding:.2rem .5rem;margin-top:.4rem;width:100%';
          saveBtn.textContent = 'Appliquer';
          saveBtn.addEventListener('click', async () => {
            const newLabels = [...labelPopover.querySelectorAll('input[data-lid]:checked')].map(i => i.dataset.lid);
            try {
              await UCCartManager.updateItemLabels(domain, item.id, newLabels);
              labelPopover.remove(); labelPopover = null;
              UCUIToast.show(shadowRoot, 'Labels mis à jour', 'success');
              UCUI.load();
            } catch (err) {
              console.error(LOG, 'updateItemLabels échoué', err);
              UCUIToast.show(shadowRoot, 'Erreur labels', 'error');
            }
          });
          labelPopover.appendChild(saveBtn);
        }

        el.appendChild(labelPopover);
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
