// @module uc-search.js
// [UC:search] Parser de requête + filtre des carts en mémoire.
// Dépend de : aucun

const UCSearch = (() => {
  const LOG = '[UC:search]';

  const parse = (query, labelDefs = {}) => {
    if (!query?.trim()) return { terms: [], labels: [], raw: '' };

    const raw = query.trim();
    const labelMatch = raw.match(/label:([^\s]+)/i);
    const rawLabels = labelMatch ? labelMatch[1].split(',').filter(Boolean) : [];

    const allDefs = Object.entries(labelDefs);
    const resolvedLabels = rawLabels.map(input => {
      const lower = input.toLowerCase();
      const byId = allDefs.find(([id]) => id.toLowerCase() === lower);
      if (byId) return byId[0];
      const byName = allDefs.find(([, def]) => def.name.toLowerCase().includes(lower));
      return byName ? byName[0] : input;
    });

    const termsStr = raw.replace(/label:[^\s]+/gi, '').trim();
    const terms = termsStr ? termsStr.split(/\s+/).filter(Boolean) : [];

    return { terms, labels: resolvedLabels, raw };
  };

  const filter = (carts, parsed, labelMode = 'OR', _favorites = {}) => {
    if (!parsed.terms.length && !parsed.labels.length) return carts;

    const result = {};
    for (const [domain, cart] of Object.entries(carts ?? {})) {
      const filtered = (cart.items ?? []).filter(item => _matchItem(item, domain, parsed, labelMode));
      if (filtered.length > 0) result[domain] = { ...cart, items: filtered };
    }
    return result;
  };

  const _matchItem = (item, domain, parsed, labelMode) => {
    if (parsed.terms.length) {
      const searchable = ((item.name ?? '') + ' ' + domain).toLowerCase();
      if (!parsed.terms.every(t => searchable.includes(t.toLowerCase()))) return false;
    }
    if (parsed.labels.length) {
      const itemLabels = item.labels ?? [];
      const match = labelMode === 'AND'
        ? parsed.labels.every(l => itemLabels.includes(l))
        : parsed.labels.some(l => itemLabels.includes(l));
      if (!match) return false;
    }
    return true;
  };

  return { parse, filter };
})();
