// @module uc-generic.js
// [UC:generic] Détection heuristique d'articles sur tout site e-commerce.
// Fallback quand aucun adaptateur spécifique n'est disponible.
// Retourne uniquement les articles avec score de confiance ≥ MEDIUM (nom + prix).

const UCGenericDetector = (() => {
  const LOG = '[UC:generic]';

  const CONTAINER_SELECTORS = [
    '[data-product-id]', '[data-item-id]', '[data-cart-item]',
    '.cart-item', '.basket-item', '.cart-product', '.bag-item',
    '[class*="cart-item"]', '[class*="basket-item"]',
    '[class*="product-row"]', '[class*="cart-product"]',
    '[class*="line-item"]', '[class*="order-item"]',
  ];

  const PRICE_REGEX = /([€$£¥₹])\s*([\d\s]+[.,]\d{2})|([\d\s]+[.,]\d{2})\s*([€$£¥₹])/;
  const MIN_SCORE = UC_CONFIG.GENERIC_MIN_SCORE;

  const extractName = (el) => {
    const candidates = [
      el.querySelector('h1,h2,h3,h4'),
      el.querySelector('[class*="title"]'),
      el.querySelector('[class*="name"]'),
      el.querySelector('[class*="product-name"]'),
      el.querySelector('[itemprop="name"]'),
      el.querySelector('a[href]'),
    ];
    for (const c of candidates) {
      const text = c?.textContent?.trim();
      if (text && text.length >= 6 && text.length <= 500) return text;
    }
    return null;
  };

  const extractPrice = (el) => {
    const dataPrice = el.getAttribute('data-price')
      ?? el.querySelector('[data-price]')?.getAttribute('data-price');
    if (dataPrice) {
      const n = parseFloat(dataPrice.replace(',', '.'));
      if (!isNaN(n) && n > 0) return n;
    }

    const priceEl = el.querySelector('[class*="price"], [itemprop="price"], [data-price]');
    if (priceEl) {
      const match = priceEl.textContent.match(PRICE_REGEX);
      if (match) {
        const raw = (match[2] ?? match[3]).replace(/\s/g, '');
        const normalized = /\d{1,3}\.\d{3},/.test(raw)
          ? raw.replace(/\./g, '').replace(',', '.')
          : raw.replace(/,(?=\d{3})/g, '').replace(',', '.');
        const n = parseFloat(normalized);
        if (!isNaN(n) && n > 0) return n;
      }
    }

    const match = el.textContent.match(PRICE_REGEX);
    if (match) {
      const raw = (match[2] ?? match[3]).replace(/\s/g, '');
      const normalized = /\d{1,3}\.\d{3},/.test(raw)
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw.replace(/,(?=\d{3})/g, '').replace(',', '.');
      const n = parseFloat(normalized);
      if (!isNaN(n) && n > 0) return n;
    }

    return null;
  };

  const extractCurrency = (el) => {
    const match = el.textContent.match(PRICE_REGEX);
    return match?.[1] ?? match?.[4] ?? '€';
  };

  const extractUrl = (el) => {
    const link = el.querySelector('a[href]');
    if (!link?.href) return null;
    try { return new URL(link.href, window.location.origin).href; }
    catch { return null; }
  };

  const extractImage = (el) => {
    const imgs = el.querySelectorAll('img[src]');
    for (const img of imgs) {
      if (img.naturalWidth > 0 && img.naturalWidth < 30) continue;
      const src = img.src || img.getAttribute('data-src');
      if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('sprite')) return src;
    }
    return undefined;
  };

  const extractMeta = (el) => {
    const meta = {};
    const ean = el.getAttribute('data-ean')
      ?? el.querySelector('[data-ean]')?.getAttribute('data-ean')
      ?? el.querySelector('[itemprop="gtin13"]')?.getAttribute('content')
      ?? el.querySelector('[data-barcode]')?.getAttribute('data-barcode');
    if (ean) meta.ean = ean;

    const brand = el.querySelector('[itemprop="brand"]')?.getAttribute('content')
      ?? el.querySelector('[itemprop="brand"]')?.textContent?.trim()
      ?? el.querySelector('[data-brand]')?.getAttribute('data-brand')
      ?? el.querySelector('[class*="brand"]')?.textContent?.trim();
    if (brand && brand.length < 100) meta.brand = brand;

    return Object.keys(meta).length > 0 ? meta : undefined;
  };

  const scoreItem = ({ name, price, url }) => {
    let s = 0;
    if (name) s++;
    if (price !== null) s++;
    if (url) s++;
    return s;
  };

  const deduplicateByUrl = (items) => {
    const seen = new Set();
    return items.filter(i => {
      if (!i.url) return true;
      if (seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    });
  };

  const extract = () => {
    let containers = [];
    for (const sel of CONTAINER_SELECTORS) {
      try {
        const found = [...document.querySelectorAll(sel)];
        if (found.length > 0) {
          containers = found;
          console.log(LOG, `${found.length} conteneur(s) via "${sel}"`);
          break;
        }
      } catch { /* Sélecteur invalide — continuer */ }
    }

    if (containers.length === 0) {
      console.log(LOG, "Aucun conteneur d'article trouvé");
      return [];
    }

    const results = [];
    for (const el of containers) {
      try {
        const name = extractName(el);
        const price = extractPrice(el);
        const currency = extractCurrency(el);
        const url = extractUrl(el);
        const image = extractImage(el);
        const meta = extractMeta(el);
        const score = scoreItem({ name, price, url });

        if (score < MIN_SCORE) {
          console.log(LOG, `Article ignoré (score ${score}) :`, { name, price });
          continue;
        }
        results.push({ name, price, currency, url, image, meta, quantity: 1 });
      } catch (e) {
        console.warn(LOG, 'Erreur parsing conteneur', e);
      }
    }

    const deduped = deduplicateByUrl(results);
    console.log(LOG, `${deduped.length} article(s) retenu(s) sur ${containers.length} conteneur(s)`);
    return deduped;
  };

  return { extract };
})();
