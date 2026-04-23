// @module uc-favorites.js
// [UC:favorites] Gestion des favoris et alertes de baisse de prix.
// Dépend de : UCStorage, UC_KEYS

const UCFavorites = (() => {
  const LOG = '[UC:favorites]';

  const add = async (itemId, domain, threshold = null) => {
    if (!itemId || !domain) {
      console.warn(LOG, 'add(): itemId ou domain manquant');
      return;
    }
    await UCStorage.update(UC_KEYS.FAVORITES, (favs) => ({
      ...(favs ?? {}),
      [itemId]: { domain, alertThreshold: threshold, addedAt: Date.now() },
    }));
    console.log(LOG, `Favori ajouté: ${itemId} [${domain}]`);
  };

  const remove = async (itemId) => {
    await UCStorage.update(UC_KEYS.FAVORITES, (favs) => {
      const { [itemId]: _, ...rest } = favs ?? {};
      return rest;
    });
    console.log(LOG, `Favori retiré: ${itemId}`);
  };

  const isFavorite = async (itemId) => {
    const favs = (await UCStorage.get(UC_KEYS.FAVORITES)) ?? {};
    return itemId in favs;
  };

  const getAll = async () => (await UCStorage.get(UC_KEYS.FAVORITES)) ?? {};

  const setThreshold = async (itemId, pct) => {
    await UCStorage.update(UC_KEYS.FAVORITES, (favs) => {
      const all = favs ?? {};
      if (!all[itemId]) return all;
      return { ...all, [itemId]: { ...all[itemId], alertThreshold: pct } };
    });
  };

  const checkAlerts = async (carts) => {
    const favs = await getAll();
    const alerts = [];

    for (const [itemId, fav] of Object.entries(favs)) {
      const cart = carts[fav.domain];
      if (!cart?.items) continue;

      const item = cart.items.find(i => i.id === itemId);
      if (!item) continue;

      const history = item.priceHistory ?? [];
      if (history.length < 2) continue;

      const prev = history[history.length - 2].price;
      const curr = item.price;
      if (curr >= prev) continue;

      const drop = prev - curr;
      const pct = Math.round((drop / prev) * 100);

      if (fav.alertThreshold !== null && fav.alertThreshold !== undefined && pct < fav.alertThreshold) continue;

      alerts.push({ item, domain: fav.domain, drop, pct });
    }

    return alerts;
  };

  return { add, remove, isFavorite, getAll, setThreshold, checkAlerts };
})();
