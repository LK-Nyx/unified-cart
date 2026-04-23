// @module uc-labels.js
// [UC:labels] Labels persos (stockés) + génériques (détectés par mots-clés).
// Dépend de : UCStorage, UC_KEYS, UC_CONFIG

const UCLabels = (() => {
  const LOG = '[UC:labels]';

  const _genId = () =>
    'lbl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const createLabel = async (name, color) => {
    if (!name?.trim()) {
      console.warn(LOG, 'createLabel: nom manquant');
      return null;
    }
    const id = _genId();
    await UCStorage.update(UC_KEYS.LABEL_DEFS, (defs) => ({
      ...(defs ?? {}),
      [id]: { name: name.trim(), color: color ?? '#89b4fa', createdAt: Date.now() },
    }));
    console.log(LOG, `Label créé: "${name}" [${id}]`);
    return id;
  };

  const deleteLabel = async (labelId) => {
    await UCStorage.update(UC_KEYS.LABEL_DEFS, (defs) => {
      const { [labelId]: _, ...rest } = defs ?? {};
      return rest;
    });
    console.log(LOG, `Label supprimé: ${labelId}`);
  };

  const getAllDefs = async () => {
    const perso = (await UCStorage.get(UC_KEYS.LABEL_DEFS)) ?? {};
    const generic = Object.fromEntries(
      UC_CONFIG.GENERIC_LABELS.map(g => [g.id, { name: g.name, color: g.color, generic: true }])
    );
    return { ...generic, ...perso };
  };

  const applyToItem = (item, labelId) => {
    const labels = [...(item.labels ?? [])];
    if (!labels.includes(labelId)) labels.push(labelId);
    return { ...item, labels };
  };

  const removeFromItem = (item, labelId) => ({
    ...item,
    labels: (item.labels ?? []).filter(id => id !== labelId),
  });

  const detectGeneric = (item) => {
    const nameLower = (item.name ?? '').toLowerCase();
    return UC_CONFIG.GENERIC_LABELS
      .filter(g => g.keywords.some(kw => nameLower.includes(kw.toLowerCase())))
      .map(g => g.id);
  };

  const getForDomain = (carts, domain) => {
    const cart = carts[domain];
    if (!cart?.items?.length) return [];
    const labelSet = new Set();
    for (const item of cart.items) {
      for (const lid of (item.labels ?? [])) labelSet.add(lid);
    }
    return [...labelSet];
  };

  return { createLabel, deleteLabel, getAllDefs, applyToItem, removeFromItem, detectGeneric, getForDomain };
})();
