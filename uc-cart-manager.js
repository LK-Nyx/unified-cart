// @module uc-cart-manager.js
// [UC:cart] Logique métier des paniers : merge, suppression, vidage.
// Dépend de : UCStorage, UCPriceHistoryEngine, UC_KEYS, UCLabels

const UCCartManager = (() => {
  const LOG = '[UC:cart]';

  const makeItemId = (url, name) => {
    try {
      const raw = `${url ?? ''}||${name ?? ''}`;
      return btoa(encodeURIComponent(raw).slice(0, 512));
    } catch (e) {
      console.warn(LOG, 'makeItemId fallback', e);
      let h = 0;
      for (const c of `${url}${name}`) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
      return `fallback_${Math.abs(h)}`;
    }
  };

  const mergeCart = async (domain, incomingItems) => {
    if (!domain || !Array.isArray(incomingItems)) {
      console.warn(LOG, 'mergeCart: arguments invalides', { domain, count: incomingItems?.length });
      return;
    }
    if (incomingItems.length === 0) return;

    await UCStorage.update(UC_KEYS.CARTS, (carts) => {
      const all = carts ?? {};
      const existing = all[domain] ?? { items: [], lastUpdated: 0 };
      const itemMap = new Map(existing.items.map(i => [i.id, i]));
      const itemNameMap = new Map(existing.items.map(i => [i.name?.toLowerCase().trim(), i.id]));
      let validCount = 0;

      for (const incoming of incomingItems) {
        if (!incoming.name || incoming.price == null) {
          console.warn(LOG, 'Article ignoré (nom ou prix manquant)', incoming);
          continue;
        }
        validCount++;
        let id = incoming.id ?? makeItemId(incoming.url, incoming.name);

        // Dédup par nom si l'ID url-based ne matche pas
        if (!itemMap.has(id)) {
          const idByName = itemNameMap.get(incoming.name?.toLowerCase().trim());
          if (idByName) {
            console.log(LOG, `Dédup par nom : "${incoming.name}"`);
            id = idByName;
          }
        }

        if (itemMap.has(id)) {
          const current = itemMap.get(id);
          const withHistory = UCPriceHistoryEngine.append(current, incoming.price);
          const source = (current.source === 'cart' || incoming.source === 'cart') ? 'cart' : 'browse';
          const genericLabels = UCLabels.detectGeneric(incoming);
          const userLabels = (current.labels ?? []).filter(
            lid => !UC_CONFIG.GENERIC_LABELS.some(g => g.id === lid)
          );
          itemMap.set(id, {
            ...withHistory,
            price: incoming.price,
            quantity: incoming.quantity ?? current.quantity ?? 1,
            image: incoming.image ?? current.image,
            source,
            labels: [...new Set([...userLabels, ...genericLabels])],
            meta: { ...(current.meta ?? {}), ...(incoming.meta ?? {}) },
          });
        } else {
          console.log(LOG, `Nouvel article dans ${domain} : "${incoming.name}"`);
          const genericLabels = UCLabels.detectGeneric(incoming);
          itemMap.set(id, {
            ...incoming,
            id,
            addedAt: Date.now(),
            quantity: incoming.quantity ?? 1,
            labels: [...new Set([...(incoming.labels ?? []), ...genericLabels])],
            priceHistory: [{ price: incoming.price, seenAt: Date.now() }],
          });
          itemNameMap.set(incoming.name?.toLowerCase().trim(), id);
        }
      }

      if (validCount === 0) return all;
      return { ...all, [domain]: { items: [...itemMap.values()], lastUpdated: Date.now() } };
    });
  };

  const removeItem = async (domain, itemId) => {
    await UCStorage.update(UC_KEYS.CARTS, (carts) => {
      const all = carts ?? {};
      if (!all[domain]) return all;
      return {
        ...all,
        [domain]: {
          ...all[domain],
          items: all[domain].items.filter(i => i.id !== itemId),
          lastUpdated: Date.now(),
        },
      };
    });
    console.log(LOG, `Article ${itemId} retiré de ${domain}`);
  };

  const clearCart = async (domain) => {
    await UCStorage.update(UC_KEYS.CARTS, (carts) => {
      const all = carts ?? {};
      const { [domain]: _, ...rest } = all;
      return rest;
    });
    console.log(LOG, `Panier ${domain} vidé`);
  };

  const getAllCarts = async () => {
    return (await UCStorage.get(UC_KEYS.CARTS)) ?? {};
  };

  return { mergeCart, removeItem, clearCart, getAllCarts };
})();
