// @module uc-price-history.js
// [UC:price-history] Gestion de l'historique des prix par article.
// Ne touche pas au storage — manipule uniquement les objets CartItem.

const UCPriceHistoryEngine = (() => {
  const LOG = '[UC:price-history]';
  const MAX = UC_CONFIG.PRICE_HISTORY_MAX;
  const TOLERANCE = 0.001;

  const pricesEqual = (a, b) => Math.abs(a - b) < TOLERANCE;

  const append = (item, newPrice) => {
    if (typeof newPrice !== 'number' || !isFinite(newPrice)) return item;
    const history = item.priceHistory ?? [];
    const last = history[history.length - 1];
    if (last && pricesEqual(last.price, newPrice)) return item;
    const entry = { price: newPrice, seenAt: Date.now() };
    const updated = [...history, entry].slice(-MAX);
    if (last) console.log(LOG, `Changement prix "${item.name}" : ${last.price} → ${newPrice}`);
    return { ...item, priceHistory: updated };
  };

  const trend = (item) => {
    const h = item.priceHistory ?? [];
    if (h.length < 2) return 'unknown';
    const first = h[0].price, last = h[h.length - 1].price;
    if (pricesEqual(first, last)) return 'stable';
    return last < first ? 'down' : 'up';
  };

  const trendLabel = (item) => {
    const h = item.priceHistory ?? [];
    if (h.length < 2) return null;
    const first = h[0].price, last = h[h.length - 1].price;
    if (pricesEqual(first, last)) return '→ Stable';
    const pct = first === 0 ? 100 : Math.round(Math.abs((last - first) / first) * 100);
    return last < first ? `↓ -${pct}%` : `↑ +${pct}%`;
  };

  return { append, trend, trendLabel };
})();
