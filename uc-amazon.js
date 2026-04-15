// @module uc-amazon.js
// [UC:amazon] Adaptateur d'extraction pour Amazon (toutes régions).
// UCAdapters.amazon.extract() → CartItem[]
// Sélecteurs testés sur amazon.fr, amazon.com, amazon.de (2025).
// En cas de refonte Amazon : vérifier data-asin et .sc-product-title.

if (typeof UCAdapters === 'undefined') var UCAdapters = {};

UCAdapters.amazon = (() => {
  const LOG = '[UC:amazon]';

  const TLD_CURRENCY = {
    'amazon.fr': '€', 'amazon.de': '€', 'amazon.es': '€',
    'amazon.it': '€', 'amazon.nl': '€', 'amazon.be': '€',
    'amazon.co.uk': '£', 'amazon.co.jp': '¥',
    'amazon.ca': 'CA$', 'amazon.com.br': 'R$',
  };

  const getCurrency = () => {
    const host = window.location.hostname.replace(/^www\./, '');
    return TLD_CURRENCY[host] ?? '$';
  };

  const getTLD = () => window.location.hostname.replace(/^www\./, '');

  const parsePrice = (text) => {
    if (!text) return null;
    const cleaned = text.trim().replace(/[^\d,\.]/g, '');
    if (!cleaned) return null;
    if (/\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned))
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    if (/\d{1,3}(,\d{3})*\.\d{2}$/.test(cleaned))
      return parseFloat(cleaned.replace(/,/g, ''));
    const match = cleaned.match(/(\d+)[,.](\d{2})$/);
    if (match) return parseFloat(`${match[1]}.${match[2]}`);
    return null;
  };

  const extract = () => {
    const items = [];
    const currency = getCurrency();
    const tld = getTLD();

    const containers = document.querySelectorAll('[data-asin]:not([data-asin=""]), .sc-list-item');

    for (const el of containers) {
      try {
        const asin = el.getAttribute('data-asin');
        if (!asin || asin.length < 3) continue;

        const nameEl = el.querySelector(
          '.sc-product-title .a-truncate-cut, .sc-product-title span, [class*="product-title"] span, .a-truncate-cut'
        );
        const name = nameEl?.textContent?.trim();
        if (!name || name.length < 2) continue;

        const priceEl = el.querySelector(
          '.sc-price .a-offscreen, .sc-product-price .a-offscreen, .sc-product-price, .a-price .a-offscreen'
        );
        const price = parsePrice(priceEl?.textContent);
        if (price === null) {
          console.warn(LOG, `Prix introuvable pour ASIN ${asin} ("${name}")`);
          continue;
        }

        const url = `https://www.${tld}/dp/${asin}`;
        const imgEl = el.querySelector('.sc-product-image img, [class*="product-image"] img, img[src*="images-amazon"]');
        const image = imgEl?.src ?? undefined;

        const qtySelect = el.querySelector('select[name="quantity"]');
        const qtyInput = el.querySelector('input[name="quantity"]');
        const quantity = qtySelect
          ? (parseInt(qtySelect.value, 10) || 1)
          : (qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1);

        const brandEl = el.querySelector('.bylineInfo a, [data-feature-name="bylineInfo"] a');
        const brand = brandEl?.textContent?.trim() || undefined;

        items.push({ name, price, currency, url, image, quantity,
          meta: { asin, ...(brand ? { brand } : {}) } });

        console.log(LOG, `Extrait : "${name}" – ${currency}${price} ×${quantity}`);
      } catch (e) {
        console.warn(LOG, 'Erreur parsing article Amazon', e);
      }
    }

    console.log(LOG, `${items.length} article(s) trouvé(s) sur ${tld}`);
    return items;
  };

  return { extract };
})();
