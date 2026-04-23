# Tracker de Shopping — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Étendre Unified Cart en tracker de shopping avec labels, barre de recherche, favoris, alertes de prix et graphiques historiques.

**Architecture:** Quatre nouveaux modules IIFE (`uc-labels`, `uc-favorites`, `uc-search`, `uc-price-chart`) s'insèrent dans la chaîne `@require` existante. L'UI gagne une searchbar, une section Favoris et un onglet Historique. Toute la donnée reste 100% locale via UCStorage/GM.

**Tech Stack:** Vanilla JS ES2020, IIFE modules, Shadow DOM, SVG natif, GM API (Tampermonkey). Zéro npm/bundler. Tests browser-only via `tests/test-runner.html`.

---

## Fichiers touchés

### Nouveaux
- `uc-labels.js` — UCLabels : CRUD labels persos + détection génériques
- `uc-favorites.js` — UCFavorites : favoris + seuils d'alerte
- `uc-search.js` — UCSearch : parser requête + filtre carts
- `uc-price-chart.js` — UCPriceChart : rendu SVG mini/full
- `tests/uc-labels.test.js`
- `tests/uc-favorites.test.js`
- `tests/uc-search.test.js`
- `tests/uc-price-chart.test.js`

### Modifiés
- `uc-constants.js` — nouvelles clés UC_KEYS + UC_CONFIG.GENERIC_LABELS
- `uc-cart-manager.js` — labels[] dans mergeCart
- `uc-ui-styles.js` — CSS searchbar, chips, badges, ⭐, chart, section favoris
- `uc-ui-item.js` — badges labels, bouton ⭐, popover seuil, drill-down chart
- `uc-ui-list.js` — badges site, renderFavoritesSection()
- `uc-ui.js` — searchbar, onglet 📈, section favoris, checkAlerts
- `unified-cart.user.js` — nouveaux @require, appel checkAlerts
- `tests/test-runner.html` — nouveaux `<script>` modules + tests

---

## PHASE 1 — Labels + Recherche

---

### Tâche 1 : Constantes

**Fichiers :**
- Modifier : `uc-constants.js`

- [ ] **Étape 1 : Remplacer le contenu de `uc-constants.js`**

```js
// @module uc-constants.js
// [UC:constants] Constantes partagées — clés storage, config.

const UC_KEYS = Object.freeze({
  CARTS:         'carts',
  WATCHED_PAGES: 'watchedPages',
  BTN_POS:       'uc_btn_pos',
  SIDE:          'uc_side',
  LABEL_DEFS:    'uc_label_defs',
  FAVORITES:     'uc_favorites',
});

const UC_CONFIG = Object.freeze({
  PRICE_HISTORY_MAX: 100,
  GENERIC_MIN_SCORE: 2,
  GENERIC_LABELS: [
    { id: 'tech',    name: 'Technologie',    color: '#3b82f6', keywords: ['gpu','cpu','ssd','ram','pc','laptop','monitor','clavier','souris','écran','processeur','carte graphique'] },
    { id: 'gaming',  name: 'Gaming',         color: '#8b5cf6', keywords: ['jeu','game','manette','controller','ps5','xbox','nintendo','steam','gaming'] },
    { id: 'audio',   name: 'Audio',          color: '#06b6d4', keywords: ['casque','écouteur','enceinte','microphone','dac','ampli','hifi','audio'] },
    { id: 'photo',   name: 'Photo/Vidéo',    color: '#f59e0b', keywords: ['camera','objectif','trépied','drone','gopro','appareil photo','caméra'] },
    { id: 'maison',  name: 'Maison',         color: '#10b981', keywords: ['aspirateur','cafetière','frigo','four','lave','électroménager','robot'] },
    { id: 'mode',    name: 'Mode',           color: '#ec4899', keywords: ['veste','pantalon','chaussure','robe','sac','montre','vêtement','sneaker'] },
    { id: 'livre',   name: 'Livres',         color: '#84cc16', keywords: ['livre','roman','manga','bd','comic','bande dessinée'] },
    { id: 'sport',   name: 'Sport',          color: '#f97316', keywords: ['vélo','raquette','musculation','fitness','yoga','tapis de sport','haltère'] },
    { id: 'jardin',  name: 'Jardin/Plantes', color: '#22c55e', keywords: ['plante','pot','terreau','arrosoir','tondeuse','graine','jardinage'] },
    { id: 'beaute',  name: 'Beauté',         color: '#e879f9', keywords: ['parfum','crème','sérum','mascara','rouge','shampoing','cosmétique'] },
  ],
});
```

- [ ] **Étape 2 : Vérifier dans le navigateur**

Ouvrir `tests/test-runner.html`. Tous les tests existants doivent passer (les nouvelles clés ne cassent rien).

- [ ] **Étape 3 : Commit**

```bash
git add uc-constants.js
git commit -m "feat(constants): nouvelles clés LABEL_DEFS/FAVORITES + UC_CONFIG.GENERIC_LABELS"
```

---

### Tâche 2 : Module `uc-labels.js`

**Fichiers :**
- Créer : `uc-labels.js`
- Créer : `tests/uc-labels.test.js`
- Modifier : `tests/test-runner.html`

- [ ] **Étape 1 : Créer `tests/uc-labels.test.js` (tests qui vont échouer)**

```js
// tests/uc-labels.test.js

UC_TEST.it('labels: detectGeneric() détecte "gpu" → tech', () => {
  const item = { name: 'RTX 4090 GPU 24Go', labels: [] };
  const ids = UCLabels.detectGeneric(item);
  UC_TEST.assert(ids.includes('tech'), `Attendu 'tech' dans ${JSON.stringify(ids)}`);
});

UC_TEST.it('labels: detectGeneric() case-insensitive', () => {
  const item = { name: 'CASQUE Gaming RGB', labels: [] };
  const ids = UCLabels.detectGeneric(item);
  UC_TEST.assert(ids.includes('audio') || ids.includes('gaming'), `Attendu audio ou gaming dans ${JSON.stringify(ids)}`);
});

UC_TEST.it('labels: detectGeneric() retourne [] pour nom quelconque', () => {
  const item = { name: 'Produit inconnu 42', labels: [] };
  const ids = UCLabels.detectGeneric(item);
  UC_TEST.assertEqual(ids.length, 0);
});

UC_TEST.it('labels: applyToItem() ajoute un label (immuable)', () => {
  const item = { id: '1', name: 'Test', labels: [] };
  const updated = UCLabels.applyToItem(item, 'tech');
  UC_TEST.assert(updated.labels.includes('tech'), 'Label non ajouté');
  UC_TEST.assertEqual(item.labels.length, 0, 'Item original muté');
});

UC_TEST.it('labels: applyToItem() ne duplique pas un label existant', () => {
  const item = { id: '1', name: 'Test', labels: ['tech'] };
  const updated = UCLabels.applyToItem(item, 'tech');
  UC_TEST.assertEqual(updated.labels.length, 1);
});

UC_TEST.it('labels: removeFromItem() retire un label (immuable)', () => {
  const item = { id: '1', name: 'Test', labels: ['tech', 'gaming'] };
  const updated = UCLabels.removeFromItem(item, 'tech');
  UC_TEST.assert(!updated.labels.includes('tech'), 'Label non retiré');
  UC_TEST.assert(updated.labels.includes('gaming'), 'Autre label perdu');
  UC_TEST.assertEqual(item.labels.length, 2, 'Item original muté');
});

UC_TEST.it('labels: getForDomain() retourne union des labels', () => {
  const carts = {
    'example.com': {
      items: [
        { id: '1', name: 'A', labels: ['tech', 'gaming'] },
        { id: '2', name: 'B', labels: ['gaming', 'audio'] },
      ]
    }
  };
  const labels = UCLabels.getForDomain(carts, 'example.com');
  UC_TEST.assert(labels.includes('tech'), 'tech manquant');
  UC_TEST.assert(labels.includes('gaming'), 'gaming manquant');
  UC_TEST.assert(labels.includes('audio'), 'audio manquant');
  UC_TEST.assertEqual(labels.length, 3);
});

UC_TEST.it('labels: getForDomain() retourne [] pour domaine vide', () => {
  const carts = {};
  const labels = UCLabels.getForDomain(carts, 'nonexistent.com');
  UC_TEST.assertEqual(labels.length, 0);
});

UC_TEST.it('labels: createLabel() persiste et retourne un id', async () => {
  GM._reset();
  const id = await UCLabels.createLabel('Promo', '#ff0000');
  UC_TEST.assert(typeof id === 'string' && id.startsWith('lbl_'), `ID invalide: ${id}`);
  const defs = await UCLabels.getAllDefs();
  UC_TEST.assert(id in defs, 'Label non trouvé dans defs');
  UC_TEST.assertEqual(defs[id].name, 'Promo');
  UC_TEST.assertEqual(defs[id].color, '#ff0000');
});

UC_TEST.it('labels: getAllDefs() fusionne génériques + persos', async () => {
  GM._reset();
  const id = await UCLabels.createLabel('Perso', '#abc');
  const defs = await UCLabels.getAllDefs();
  UC_TEST.assert('tech' in defs, 'Label générique tech manquant');
  UC_TEST.assert(id in defs, 'Label perso manquant');
  UC_TEST.assert(defs['tech'].generic === true, 'Flag generic manquant sur tech');
  UC_TEST.assert(!defs[id].generic, 'Flag generic présent sur label perso');
});

UC_TEST.it('labels: deleteLabel() supprime du storage', async () => {
  GM._reset();
  const id = await UCLabels.createLabel('Temp', '#000');
  await UCLabels.deleteLabel(id);
  const defs = await UCLabels.getAllDefs();
  UC_TEST.assert(!(id in defs), 'Label encore présent après suppression');
});
```

- [ ] **Étape 2 : Ajouter le script dans `tests/test-runner.html`**

Après `<script src="../uc-price-history.js"></script>` et avant `<script src="../uc-cart-manager.js"></script>`, ajouter :

```html
  <script src="../uc-labels.js"></script>
  <script src="../uc-favorites.js"></script>
```

Et dans la section tests, après `<script src="uc-price-history.test.js"></script>` :

```html
  <script src="uc-labels.test.js"></script>
  <script src="uc-favorites.test.js"></script>
  <script src="uc-search.test.js"></script>
  <script src="uc-price-chart.test.js"></script>
```

Et dans la section modules, après `<script src="../uc-utils.js"></script>` :

```html
  <script src="../uc-search.js"></script>
  <script src="../uc-price-chart.js"></script>
```

> Note : `uc-favorites.js`, `uc-search.js`, `uc-price-chart.js` n'existent pas encore — créer des fichiers vides temporairement pour éviter 404 :
> ```bash
> touch uc-favorites.js uc-search.js uc-price-chart.js
> touch tests/uc-favorites.test.js tests/uc-search.test.js tests/uc-price-chart.test.js
> ```

- [ ] **Étape 3 : Vérifier que les tests labels échouent**

Ouvrir `tests/test-runner.html` dans le navigateur. Les tests `labels:` doivent apparaître en rouge avec `UCLabels is not defined`.

- [ ] **Étape 4 : Créer `uc-labels.js`**

```js
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
```

- [ ] **Étape 5 : Vérifier que les tests labels passent**

Recharger `tests/test-runner.html`. Tous les tests `labels:` doivent être verts.

- [ ] **Étape 6 : Commit**

```bash
git add uc-labels.js tests/uc-labels.test.js tests/test-runner.html uc-favorites.js uc-search.js uc-price-chart.js tests/uc-favorites.test.js tests/uc-search.test.js tests/uc-price-chart.test.js
git commit -m "feat(labels): module UCLabels — détection génériques + CRUD persos"
```

---

### Tâche 3 : Module `uc-search.js`

**Fichiers :**
- Modifier : `uc-search.js` (remplacer le fichier vide)
- Modifier : `tests/uc-search.test.js` (remplacer le fichier vide)

- [ ] **Étape 1 : Écrire `tests/uc-search.test.js`**

```js
// tests/uc-search.test.js

const _defs = {
  tech:   { name: 'Technologie', color: '#3b82f6', generic: true },
  gaming: { name: 'Gaming',      color: '#8b5cf6', generic: true },
  lbl_x:  { name: 'Promo',       color: '#ff0000' },
};

UC_TEST.it('search: parse() — query vide', () => {
  const p = UCSearch.parse('', _defs);
  UC_TEST.assertEqual(p.terms.length, 0);
  UC_TEST.assertEqual(p.labels.length, 0);
});

UC_TEST.it('search: parse() — termes simples', () => {
  const p = UCSearch.parse('gpu rtx', _defs);
  UC_TEST.assertDeepEqual(p.terms, ['gpu', 'rtx']);
  UC_TEST.assertEqual(p.labels.length, 0);
});

UC_TEST.it('search: parse() — label par ID', () => {
  const p = UCSearch.parse('label:tech', _defs);
  UC_TEST.assertEqual(p.labels.length, 1);
  UC_TEST.assert(p.labels.includes('tech'), 'ID tech non résolu');
});

UC_TEST.it('search: parse() — label par nom (partiel)', () => {
  const p = UCSearch.parse('label:Techno', _defs);
  UC_TEST.assert(p.labels.includes('tech'), `tech non résolu depuis 'Techno', labels=${JSON.stringify(p.labels)}`);
});

UC_TEST.it('search: parse() — plusieurs labels', () => {
  const p = UCSearch.parse('label:tech,gaming', _defs);
  UC_TEST.assertEqual(p.labels.length, 2);
  UC_TEST.assert(p.labels.includes('tech'));
  UC_TEST.assert(p.labels.includes('gaming'));
});

UC_TEST.it('search: parse() — mix termes + label', () => {
  const p = UCSearch.parse('rtx label:tech soldes', _defs);
  UC_TEST.assert(p.terms.includes('rtx'));
  UC_TEST.assert(p.terms.includes('soldes'));
  UC_TEST.assert(p.labels.includes('tech'));
});

const _carts = {
  'eneba.com': { items: [
    { id: '1', name: 'RTX 4090', price: 800, labels: ['tech'] },
    { id: '2', name: 'Manette PS5', price: 70, labels: ['gaming'] },
  ]},
  'amazon.fr': { items: [
    { id: '3', name: 'Casque audio', price: 150, labels: ['tech', 'audio'] },
  ]},
};

UC_TEST.it('search: filter() — query vide retourne tout', () => {
  const parsed = UCSearch.parse('', _defs);
  const result = UCSearch.filter(_carts, parsed, 'OR', {});
  UC_TEST.assertEqual(Object.keys(result).length, 2);
});

UC_TEST.it('search: filter() — filtre par terme dans le nom', () => {
  const parsed = UCSearch.parse('rtx', _defs);
  const result = UCSearch.filter(_carts, parsed, 'OR', {});
  UC_TEST.assertEqual(Object.keys(result).length, 1);
  UC_TEST.assert('eneba.com' in result);
  UC_TEST.assertEqual(result['eneba.com'].items.length, 1);
});

UC_TEST.it('search: filter() — filtre par domaine', () => {
  const parsed = UCSearch.parse('amazon', _defs);
  const result = UCSearch.filter(_carts, parsed, 'OR', {});
  UC_TEST.assert('amazon.fr' in result);
  UC_TEST.assertEqual(Object.keys(result).length, 1);
});

UC_TEST.it('search: filter() — label OR', () => {
  const parsed = UCSearch.parse('label:tech,gaming', _defs);
  const result = UCSearch.filter(_carts, parsed, 'OR', {});
  const allItems = Object.values(result).flatMap(c => c.items);
  UC_TEST.assertEqual(allItems.length, 3);
});

UC_TEST.it('search: filter() — label AND exclut les partials', () => {
  const parsed = UCSearch.parse('label:tech,gaming', _defs);
  const result = UCSearch.filter(_carts, parsed, 'AND', {});
  const allItems = Object.values(result).flatMap(c => c.items);
  // Seul l'article avec TOUS les labels → aucun ici (RTX=tech only, Manette=gaming only, Casque=tech+audio)
  UC_TEST.assertEqual(allItems.length, 0);
});

UC_TEST.it('search: filter() — domaine sans match retiré', () => {
  const parsed = UCSearch.parse('rtx', _defs);
  const result = UCSearch.filter(_carts, parsed, 'OR', {});
  UC_TEST.assert(!('amazon.fr' in result), 'amazon.fr ne devrait pas apparaître');
});
```

- [ ] **Étape 2 : Vérifier que les tests search échouent**

Recharger `tests/test-runner.html`. Les tests `search:` doivent être rouges avec `UCSearch is not defined`.

- [ ] **Étape 3 : Écrire `uc-search.js`**

```js
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
      const filtered = cart.items.filter(item => _matchItem(item, domain, parsed, labelMode));
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
```

- [ ] **Étape 4 : Vérifier que les tests search passent**

Recharger `tests/test-runner.html`. Tous les tests `search:` doivent être verts.

- [ ] **Étape 5 : Commit**

```bash
git add uc-search.js tests/uc-search.test.js
git commit -m "feat(search): module UCSearch — parse requête label:X,Y + filtre AND/OR"
```

---

### Tâche 4 : Labels dans `uc-cart-manager.js`

**Fichiers :**
- Modifier : `uc-cart-manager.js`

- [ ] **Étape 1 : Localiser le bloc d'insertion d'un nouvel article (ligne ~64)**

Dans la branche `else` du `if (itemMap.has(id))`, après `const withHistory = ...` et `itemMap.set(id, { ...withHistory, ... })` pour les articles existants, et dans le bloc nouvel article :

Remplacer les deux blocs `itemMap.set` par les versions suivantes qui intègrent la gestion des labels :

**Bloc article existant** (remplacer `itemMap.set(id, { ...withHistory, ...})`) :

```js
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
```

**Bloc nouvel article** (remplacer `itemMap.set(id, { ...incoming, id, ... })`) :

```js
          const genericLabels = UCLabels.detectGeneric(incoming);
          itemMap.set(id, {
            ...incoming,
            id,
            addedAt: Date.now(),
            quantity: incoming.quantity ?? 1,
            labels: [...new Set([...(incoming.labels ?? []), ...genericLabels])],
            priceHistory: [{ price: incoming.price, seenAt: Date.now() }],
          });
```

- [ ] **Étape 2 : Vérifier les tests existants**

Recharger `tests/test-runner.html`. Tous les tests `cart-manager:` doivent rester verts.

- [ ] **Étape 3 : Commit**

```bash
git add uc-cart-manager.js
git commit -m "feat(cart-manager): labels[] dans mergeCart — génériques auto + persos préservés"
```

---

### Tâche 5 : CSS — Searchbar, chips, badges labels

**Fichiers :**
- Modifier : `uc-ui-styles.js`

- [ ] **Étape 1 : Ajouter les styles à la fin du template CSS (avant le backtick fermant)**

```css
/* ── Searchbar ── */
.uc-searchbar {
  padding: .4rem .75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.uc-searchbar__row {
  display: flex;
  align-items: center;
  gap: .4rem;
}

.uc-searchbar__icon { color: var(--muted); font-size: 13px; }

.uc-searchbar__input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font);
  font-size: 12px;
  padding: .25rem .4rem;
}

.uc-searchbar__input:focus { outline: none; border-color: var(--accent); }

.uc-searchbar__clear {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0 .2rem;
  line-height: 1;
}

.uc-searchbar__clear:hover { color: var(--text); }

.uc-searchbar__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .3rem;
  margin-top: .35rem;
  min-height: 0;
}

.uc-searchbar__chips:empty { display: none; }

.uc-label-mode {
  display: flex;
  gap: .2rem;
  margin-right: .2rem;
}

.uc-label-mode__btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--muted);
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  padding: .1rem .35rem;
  text-transform: uppercase;
}

.uc-label-mode__btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.uc-chip {
  display: inline-flex;
  align-items: center;
  gap: .2rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 10px;
  padding: .1rem .4rem;
  color: var(--text);
}

.uc-chip__remove {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}

.uc-chip__remove:hover { color: var(--red); }

/* ── Label badges ── */
.uc-label-badges {
  display: flex;
  flex-wrap: wrap;
  gap: .2rem;
  margin-top: .2rem;
}

.uc-label-badge {
  font-size: 9px;
  font-weight: 700;
  padding: .05rem .3rem;
  border-radius: 99px;
  color: #fff;
  opacity: .85;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ── Section Favoris ── */
.uc-favorites-section {
  border-bottom: 2px solid var(--accent);
}

.uc-favorites-section .uc-cart-section__domain { color: var(--yellow); }

/* ── Bouton favori ── */
.uc-btn--fav {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0 .2rem;
  line-height: 1;
  opacity: .5;
  transition: opacity .15s, transform .15s;
}

.uc-btn--fav:hover { opacity: 1; transform: scale(1.15); }
.uc-btn--fav--active { opacity: 1; color: var(--yellow); }

/* ── Popover seuil alerte ── */
.uc-threshold-popover {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: .5rem .6rem;
  margin-top: .3rem;
  font-size: 11px;
}

.uc-threshold-popover__row {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-bottom: .4rem;
}

.uc-threshold-popover__input {
  width: 48px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 11px;
  padding: .15rem .3rem;
  text-align: right;
}

.uc-threshold-popover__actions { display: flex; gap: .3rem; }

/* ── Chart drill-down ── */
.uc-chart-panel {
  padding: .4rem .75rem .5rem 1.5rem;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.uc-chart-panel__header {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-bottom: .35rem;
  font-size: 11px;
  color: var(--muted);
}

.uc-chart-panel__back {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.uc-chart-panel svg { display: block; }

.uc-chart-panel__stats {
  font-size: 10px;
  color: var(--muted);
  margin-top: .25rem;
}

/* ── Onglet Historique ── */
#uc-view-history { display: none; }
#uc-view-history.uc-view--active { display: flex; flex-direction: column; flex: 1; overflow: hidden; }

.uc-history-list {
  overflow-y: auto;
  flex: 1;
  padding: .5rem 0;
}

.uc-history-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .4rem .75rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background .15s;
}

.uc-history-item:hover { background: var(--surface); }

.uc-history-item__info { flex: 1; min-width: 0; }
.uc-history-item__name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uc-history-item__domain { font-size: 10px; color: var(--muted); }
```

- [ ] **Étape 2 : Vérifier**

Recharger `tests/test-runner.html`. Les tests `ui-styles:` doivent rester verts.

- [ ] **Étape 3 : Commit**

```bash
git add uc-ui-styles.js
git commit -m "feat(styles): CSS searchbar, chips, badges labels, favoris, chart, historique"
```

---

### Tâche 6 : Searchbar dans `uc-ui.js`

**Fichiers :**
- Modifier : `uc-ui.js`

- [ ] **Étape 1 : Ajouter les variables d'état en haut du module**

Après `let _abortController = null;`, ajouter :

```js
  let _labelMode = 'OR';
  let _currentQuery = '';
  let _loadedCarts = {};
  let _labelDefs = {};
  let _currentView = 'main';
```

- [ ] **Étape 2 : Remplacer la ligne `load()` dans la fonction `load`**

Remplacer la fonction `load` existante par :

```js
  const load = async () => {
    try {
      _loadedCarts = await UCCartManager.getAllCarts();
      _labelDefs = await UCLabels.getAllDefs();
      if (_currentView === 'history') {
        _renderHistory();
      } else {
        const parsed = UCSearch.parse(_currentQuery, _labelDefs);
        const filtered = UCSearch.filter(_loadedCarts, parsed, _labelMode, {});
        _render(filtered);
      }
    } catch (err) {
      console.error(LOG, 'Erreur chargement', err);
      if (_shadow) {
        const cartsEl = _shadow.getElementById('uc-carts');
        if (cartsEl) cartsEl.innerHTML = '<p class="uc-error">Erreur de chargement des données.</p>';
      }
    }
  };
```

- [ ] **Étape 3 : Ajouter la searchbar dans le HTML de la sidebar**

Dans le HTML de la sidebar (dans `_init`), après `<div class="uc-total-bar">...</div>` et avant `<div id="uc-carts"...`, ajouter :

```html
      <div class="uc-searchbar">
        <div class="uc-searchbar__row">
          <span class="uc-searchbar__icon">🔍</span>
          <input class="uc-searchbar__input" id="uc-search-input" placeholder='Rechercher… ou label:tech,gaming' type="text" autocomplete="off">
          <button class="uc-searchbar__clear" id="uc-search-clear" title="Effacer">✕</button>
        </div>
        <div class="uc-searchbar__chips" id="uc-search-chips">
          <div class="uc-label-mode">
            <button class="uc-label-mode__btn" id="uc-mode-or">OR</button>
            <button class="uc-label-mode__btn" id="uc-mode-and">AND</button>
          </div>
        </div>
      </div>
```

- [ ] **Étape 4 : Ajouter le bouton 📈 dans le header**

Dans le HTML du header (`<div class="uc-header__actions">`), avant le bouton `uc-btn-side`, ajouter :

```html
          <button id="uc-btn-history" class="uc-btn uc-btn--icon" title="Historique des prix">📈</button>
```

- [ ] **Étape 5 : Ajouter les listeners searchbar après la section "Fermer" dans `_init`**

```js
    // ── Searchbar ──
    const searchInput = _shadow.getElementById('uc-search-input');
    const searchClear = _shadow.getElementById('uc-search-clear');
    const chipsContainer = _shadow.getElementById('uc-search-chips');
    const btnModeOr  = _shadow.getElementById('uc-mode-or');
    const btnModeAnd = _shadow.getElementById('uc-mode-and');

    const _updateModeButtons = () => {
      btnModeOr.classList.toggle('uc-label-mode__btn--active', _labelMode === 'OR');
      btnModeAnd.classList.toggle('uc-label-mode__btn--active', _labelMode === 'AND');
    };
    _updateModeButtons();

    const _renderChips = (parsed) => {
      const existing = chipsContainer.querySelectorAll('.uc-chip');
      existing.forEach(c => c.remove());
      for (const labelId of parsed.labels) {
        const def = _labelDefs[labelId];
        const chip = document.createElement('span');
        chip.className = 'uc-chip';
        chip.style.borderColor = def?.color ?? '#89b4fa';
        chip.innerHTML = `<span>${UCUtils.esc(def?.name ?? labelId)}</span><button class="uc-chip__remove" data-lid="${UCUtils.esc(labelId)}" title="Retirer ce label">×</button>`;
        chipsContainer.appendChild(chip);
      }
    };

    const _removeChipLabel = (labelId) => {
      const current = searchInput.value;
      const match = current.match(/label:([^\s]+)/i);
      if (!match) return;
      const remaining = match[1].split(',').filter(id => id !== labelId);
      searchInput.value = remaining.length
        ? current.replace(/label:[^\s]+/i, `label:${remaining.join(',')}`)
        : current.replace(/label:[^\s]+\s?/i, '').trim();
      searchInput.dispatchEvent(new Event('input'));
    };

    chipsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.uc-chip__remove');
      if (btn) _removeChipLabel(btn.dataset.lid);
    });

    searchInput.addEventListener('input', () => {
      _currentQuery = searchInput.value;
      const parsed = UCSearch.parse(_currentQuery, _labelDefs);
      _renderChips(parsed);
      load();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      _currentQuery = '';
      _renderChips({ labels: [] });
      load();
    });

    btnModeOr.addEventListener('click', () => {
      _labelMode = 'OR';
      _updateModeButtons();
      if (_currentQuery) load();
    });

    btnModeAnd.addEventListener('click', () => {
      _labelMode = 'AND';
      _updateModeButtons();
      if (_currentQuery) load();
    });

    // ── Onglet Historique ──
    _shadow.getElementById('uc-btn-history').addEventListener('click', () => {
      _currentView = _currentView === 'history' ? 'main' : 'history';
      load();
    });
```

- [ ] **Étape 6 : Ajouter `_renderHistory()` dans le module**

Ajouter avant `return { load, _init, _toggle, _onScan }` :

```js
  const _renderHistory = () => {
    if (!_shadow) return;
    const cartsEl = _shadow.getElementById('uc-carts');
    if (!cartsEl) return;
    cartsEl.innerHTML = '';

    const allItems = [];
    for (const [domain, cart] of Object.entries(_loadedCarts ?? {})) {
      for (const item of cart.items ?? []) {
        if ((item.priceHistory ?? []).length >= 2) allItems.push({ item, domain });
      }
    }

    if (allItems.length === 0) {
      cartsEl.innerHTML = '<p class="uc-empty">Aucun historique disponible.<br>Scannez des pages plusieurs fois pour voir l\'évolution des prix.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'uc-history-list';

    for (const { item, domain } of allItems) {
      const row = document.createElement('div');
      row.className = 'uc-history-item';

      const mini = UCPriceChart.renderMini(item);
      const info = document.createElement('div');
      info.className = 'uc-history-item__info';
      info.innerHTML = `
        <div class="uc-history-item__name" title="${UCUtils.esc(item.name)}">${UCUtils.esc(item.name)}</div>
        <div class="uc-history-item__domain">${UCUtils.esc(domain)}</div>
      `;

      row.appendChild(mini);
      row.appendChild(info);
      row.addEventListener('click', () => {
        const panel = document.createElement('div');
        panel.className = 'uc-chart-panel';
        panel.innerHTML = `
          <div class="uc-chart-panel__header">
            <button class="uc-chart-panel__back" title="Retour">←</button>
            <span>${UCUtils.esc(item.name)} — ${UCUtils.esc(domain)}</span>
          </div>
        `;
        panel.querySelector('.uc-chart-panel__back').addEventListener('click', () => load());
        const fullChart = UCPriceChart.renderFull(item);
        const prices = (item.priceHistory ?? []).map(h => h.price);
        const stats = document.createElement('div');
        stats.className = 'uc-chart-panel__stats';
        stats.textContent = prices.length
          ? `Min ${item.currency ?? '€'}${Math.min(...prices).toFixed(2)} · Max ${item.currency ?? '€'}${Math.max(...prices).toFixed(2)} · ${prices.length} points`
          : '';
        panel.appendChild(fullChart);
        panel.appendChild(stats);
        cartsEl.innerHTML = '';
        cartsEl.appendChild(panel);
      });

      list.appendChild(row);
    }
    cartsEl.appendChild(list);
  };
```

- [ ] **Étape 7 : Mettre à jour `_render` pour passer `_labelDefs` à UCUIList**

Dans `_render`, remplacer `cartsEl.appendChild(UCUIList.renderSection(domain, cart, _shadow))` par :

```js
      cartsEl.appendChild(UCUIList.renderSection(domain, cart, _shadow, _labelDefs));
```

- [ ] **Étape 8 : Vérifier dans le navigateur**

Ouvrir `tests/test-runner.html`. Tests existants verts. Puis tester manuellement sur un site e-commerce : la searchbar apparaît, saisir du texte filtre les sections.

- [ ] **Étape 9 : Commit**

```bash
git add uc-ui.js
git commit -m "feat(ui): searchbar label:X,Y + toggle AND/OR + onglet historique"
```

---

### Tâche 7 : Badges labels dans les items et sections

**Fichiers :**
- Modifier : `uc-ui-item.js`
- Modifier : `uc-ui-list.js`

- [ ] **Étape 1 : Modifier `uc-ui-item.js` — signature + badges**

Modifier la signature de `render` pour accepter un `ctx` optionnel :

```js
  const render = (item, domain, shadowRoot, ctx = {}) => {
```

Après la génération du `innerHTML` de l'article (après `.uc-cart-item__meta`), ajouter le bloc badges. Remplacer la fermeture de `el.innerHTML` par :

```js
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
```

- [ ] **Étape 2 : Modifier `uc-ui-list.js` — signature + badges site**

Modifier la signature de `renderSection` :

```js
  const renderSection = (domain, cart, shadowRoot, labelDefs = {}) => {
```

Après `section.innerHTML = \`...\``, avant `const header = section.querySelector(...)`, ajouter les badges site :

```js
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
```

Et dans `renderGroup`, passer `labelDefs` à `UCUIItem.render` :

```js
      for (const item of items) {
        itemsContainer.appendChild(UCUIItem.render(item, domain, shadowRoot, { labelDefs }));
      }
```

- [ ] **Étape 3 : Vérifier**

Recharger `tests/test-runner.html`. Les tests `ui-item:` et `ui-list:` doivent rester verts. Tester manuellement : les badges apparaissent sur les articles.

- [ ] **Étape 4 : Commit**

```bash
git add uc-ui-item.js uc-ui-list.js
git commit -m "feat(ui): badges labels sur les articles et les sections site"
```

---

### Tâche 8 : Mise à jour `unified-cart.user.js` + `test-runner.html` — Phase 1

**Fichiers :**
- Modifier : `unified-cart.user.js`
- Modifier : `tests/test-runner.html`

- [ ] **Étape 1 : Ajouter les nouveaux `@require` dans `unified-cart.user.js`**

Après `// @require .../uc-price-history.js?v=...`, ajouter (avec la version Phase 1 = 1.1.0) :

```
// @require      https://raw.githubusercontent.com/LK-Nyx/unified-cart/main/uc-labels.js?v=1.1.0
// @require      https://raw.githubusercontent.com/LK-Nyx/unified-cart/main/uc-favorites.js?v=1.1.0
```

Et après `// @require .../uc-utils.js?v=...`, ajouter :

```
// @require      https://raw.githubusercontent.com/LK-Nyx/unified-cart/main/uc-search.js?v=1.1.0
// @require      https://raw.githubusercontent.com/LK-Nyx/unified-cart/main/uc-price-chart.js?v=1.1.0
```

- [ ] **Étape 2 : Bumper la version à 1.1.0**

Changer `@version 1.0.5` → `@version 1.1.0` et toutes les occurrences de `?v=1.0.5` → `?v=1.1.0`.

- [ ] **Étape 3 : Vérifier `test-runner.html`**

S'assurer que les scripts sont dans l'ordre exact suivant dans la section Modules :

```html
  <script src="../uc-constants.js"></script>
  <script src="../uc-storage.js"></script>
  <script src="../uc-price-history.js"></script>
  <script src="../uc-labels.js"></script>
  <script src="../uc-favorites.js"></script>
  <script src="../uc-cart-manager.js"></script>
  <script src="../uc-watchlist.js"></script>
  <script src="../uc-cart-page.js"></script>
  <script src="../uc-generic.js"></script>
  <script src="../uc-amazon.js"></script>
  <script src="../uc-utils.js"></script>
  <script src="../uc-ui-styles.js"></script>
  <script src="../uc-ui-toast.js"></script>
  <script src="../uc-search.js"></script>
  <script src="../uc-price-chart.js"></script>
  <script src="../uc-ui-item.js"></script>
  <script src="../uc-ui-list.js"></script>
  <script src="../uc-ui.js"></script>
```

- [ ] **Étape 4 : Vérifier tous les tests**

Recharger `tests/test-runner.html`. 100% des tests doivent être verts.

- [ ] **Étape 5 : Commit + push Phase 1**

```bash
git add unified-cart.user.js tests/test-runner.html
git commit -m "feat: Phase 1 — labels + searchbar (v1.1.0)"
git push nyx main
```

- [ ] **Étape 6 : Déployer dans Tampermonkey**

Dans Tampermonkey → Dashboard → Unified Cart → Vérifier les mises à jour. Si non proposé, réinstaller depuis l'URL raw :
`https://raw.githubusercontent.com/LK-Nyx/unified-cart/main/unified-cart.user.js`

---

## PHASE 2 — Favoris, Alertes, Graphiques

---

### Tâche 9 : Module `uc-favorites.js`

**Fichiers :**
- Modifier : `uc-favorites.js` (remplacer le fichier vide)
- Modifier : `tests/uc-favorites.test.js` (remplacer le fichier vide)

- [ ] **Étape 1 : Écrire `tests/uc-favorites.test.js`**

```js
// tests/uc-favorites.test.js

const _makeCart = (itemId, price, history) => ({
  'test.com': {
    items: [{
      id: itemId,
      name: 'Article test',
      price,
      currency: '€',
      labels: [],
      priceHistory: history,
    }]
  }
});

UC_TEST.it('favorites: add() persiste un favori', async () => {
  GM._reset();
  await UCFavorites.add('item1', 'test.com', null);
  const all = await UCFavorites.getAll();
  UC_TEST.assert('item1' in all, 'item1 non trouvé dans les favoris');
  UC_TEST.assertEqual(all['item1'].domain, 'test.com');
  UC_TEST.assertEqual(all['item1'].alertThreshold, null);
});

UC_TEST.it('favorites: isFavorite() retourne true/false', async () => {
  GM._reset();
  await UCFavorites.add('item2', 'test.com', null);
  UC_TEST.assert(await UCFavorites.isFavorite('item2'), 'item2 devrait être favori');
  UC_TEST.assert(!(await UCFavorites.isFavorite('item99')), 'item99 ne devrait pas être favori');
});

UC_TEST.it('favorites: remove() supprime un favori', async () => {
  GM._reset();
  await UCFavorites.add('item3', 'test.com', null);
  await UCFavorites.remove('item3');
  UC_TEST.assert(!(await UCFavorites.isFavorite('item3')), 'item3 encore favori après suppression');
});

UC_TEST.it('favorites: setThreshold() modifie le seuil', async () => {
  GM._reset();
  await UCFavorites.add('item4', 'test.com', null);
  await UCFavorites.setThreshold('item4', 10);
  const all = await UCFavorites.getAll();
  UC_TEST.assertEqual(all['item4'].alertThreshold, 10);
});

UC_TEST.it('favorites: checkAlerts() détecte une baisse', async () => {
  GM._reset();
  await UCFavorites.add('item5', 'test.com', null);
  const carts = _makeCart('item5', 90, [
    { price: 100, seenAt: 1000 },
    { price: 90,  seenAt: 2000 },
  ]);
  const alerts = await UCFavorites.checkAlerts(carts);
  UC_TEST.assertEqual(alerts.length, 1);
  UC_TEST.assertEqual(alerts[0].pct, 10);
  UC_TEST.assertEqual(alerts[0].domain, 'test.com');
});

UC_TEST.it('favorites: checkAlerts() respecte le seuil — baisse sous seuil ignorée', async () => {
  GM._reset();
  await UCFavorites.add('item6', 'test.com', 15);
  const carts = _makeCart('item6', 95, [
    { price: 100, seenAt: 1000 },
    { price: 95,  seenAt: 2000 },
  ]);
  const alerts = await UCFavorites.checkAlerts(carts);
  UC_TEST.assertEqual(alerts.length, 0, 'Baisse de 5% sous seuil 15% ne devrait pas alerter');
});

UC_TEST.it('favorites: checkAlerts() respecte le seuil — baisse au-dessus déclenche', async () => {
  GM._reset();
  await UCFavorites.add('item7', 'test.com', 15);
  const carts = _makeCart('item7', 80, [
    { price: 100, seenAt: 1000 },
    { price: 80,  seenAt: 2000 },
  ]);
  const alerts = await UCFavorites.checkAlerts(carts);
  UC_TEST.assertEqual(alerts.length, 1);
  UC_TEST.assertEqual(alerts[0].pct, 20);
});

UC_TEST.it('favorites: checkAlerts() ignore une hausse de prix', async () => {
  GM._reset();
  await UCFavorites.add('item8', 'test.com', null);
  const carts = _makeCart('item8', 110, [
    { price: 100, seenAt: 1000 },
    { price: 110, seenAt: 2000 },
  ]);
  const alerts = await UCFavorites.checkAlerts(carts);
  UC_TEST.assertEqual(alerts.length, 0);
});

UC_TEST.it('favorites: checkAlerts() ignore un article avec < 2 points', async () => {
  GM._reset();
  await UCFavorites.add('item9', 'test.com', null);
  const carts = _makeCart('item9', 90, [{ price: 90, seenAt: 1000 }]);
  const alerts = await UCFavorites.checkAlerts(carts);
  UC_TEST.assertEqual(alerts.length, 0);
});

UC_TEST.it('favorites: checkAlerts() ignore un favori absent des carts', async () => {
  GM._reset();
  await UCFavorites.add('item_ghost', 'autre.com', null);
  const carts = _makeCart('item10', 50, [{ price: 60, seenAt: 1 }, { price: 50, seenAt: 2 }]);
  const alerts = await UCFavorites.checkAlerts(carts);
  UC_TEST.assertEqual(alerts.length, 0);
});
```

- [ ] **Étape 2 : Vérifier que les tests favorites échouent**

Recharger `tests/test-runner.html`. Tests `favorites:` en rouge (`UCFavorites is not defined`).

- [ ] **Étape 3 : Écrire `uc-favorites.js`**

```js
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
```

- [ ] **Étape 4 : Vérifier que les tests favorites passent**

Recharger `tests/test-runner.html`. Tous les tests `favorites:` doivent être verts.

- [ ] **Étape 5 : Commit**

```bash
git add uc-favorites.js tests/uc-favorites.test.js
git commit -m "feat(favorites): module UCFavorites — favoris, seuils, alertes de prix"
```

---

### Tâche 10 : Module `uc-price-chart.js`

**Fichiers :**
- Modifier : `uc-price-chart.js` (remplacer le fichier vide)
- Modifier : `tests/uc-price-chart.test.js` (remplacer le fichier vide)

- [ ] **Étape 1 : Écrire `tests/uc-price-chart.test.js`**

```js
// tests/uc-price-chart.test.js

const _chartItem = (history) => ({
  id: 'c1', name: 'GPU Test', price: history[history.length - 1]?.price ?? 100,
  currency: '€', labels: [], priceHistory: history,
});

UC_TEST.it('price-chart: renderMini() retourne un SVGSVGElement', () => {
  const item = _chartItem([{ price: 30, seenAt: 1 }, { price: 25, seenAt: 2 }]);
  const svg = UCPriceChart.renderMini(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, `Attendu SVGSVGElement, obtenu ${svg?.constructor?.name}`);
});

UC_TEST.it('price-chart: renderMini() avec < 2 points retourne quand même un SVG', () => {
  const item = _chartItem([{ price: 30, seenAt: 1 }]);
  const svg = UCPriceChart.renderMini(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, 'SVG attendu même avec 1 point');
});

UC_TEST.it('price-chart: renderMini() dimensions 80×30', () => {
  const item = _chartItem([{ price: 30, seenAt: 1 }, { price: 25, seenAt: 2 }]);
  const svg = UCPriceChart.renderMini(item);
  UC_TEST.assertEqual(svg.getAttribute('width'), '80');
  UC_TEST.assertEqual(svg.getAttribute('height'), '30');
});

UC_TEST.it('price-chart: renderFull() retourne un SVGSVGElement', () => {
  const item = _chartItem([
    { price: 100, seenAt: 1000 },
    { price: 90, seenAt: 2000 },
    { price: 95, seenAt: 3000 },
  ]);
  const svg = UCPriceChart.renderFull(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, `Attendu SVGSVGElement, obtenu ${svg?.constructor?.name}`);
});

UC_TEST.it('price-chart: renderFull() contient une polyline', () => {
  const item = _chartItem([{ price: 100, seenAt: 1 }, { price: 80, seenAt: 2 }]);
  const svg = UCPriceChart.renderFull(item);
  const polyline = svg.querySelector('polyline');
  UC_TEST.assert(polyline !== null, 'Polyline absente du SVG');
});

UC_TEST.it('price-chart: renderFull() avec < 2 points retourne SVG avec message', () => {
  const item = _chartItem([{ price: 100, seenAt: 1 }]);
  const svg = UCPriceChart.renderFull(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, 'SVG attendu');
  const text = svg.querySelector('text');
  UC_TEST.assert(text !== null, 'Texte de fallback attendu');
});

UC_TEST.it('price-chart: renderFull() dimensions 240×100', () => {
  const item = _chartItem([{ price: 100, seenAt: 1 }, { price: 80, seenAt: 2 }]);
  const svg = UCPriceChart.renderFull(item);
  UC_TEST.assertEqual(svg.getAttribute('width'), '240');
  UC_TEST.assertEqual(svg.getAttribute('height'), '100');
});
```

- [ ] **Étape 2 : Vérifier que les tests chart échouent**

Recharger `tests/test-runner.html`. Tests `price-chart:` en rouge.

- [ ] **Étape 3 : Écrire `uc-price-chart.js`**

```js
// @module uc-price-chart.js
// [UC:price-chart] Graphiques SVG natifs à partir de priceHistory[].
// Dépend de : aucun

const UCPriceChart = (() => {
  const _NS = 'http://www.w3.org/2000/svg';

  const _svg = (w, h) => {
    const el = document.createElementNS(_NS, 'svg');
    el.setAttribute('width', String(w));
    el.setAttribute('height', String(h));
    el.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return el;
  };

  const _el = (tag, attrs) => {
    const el = document.createElementNS(_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  };

  const _text = (x, y, content, anchor = 'end', size = 9, fill = '#6c7086') => {
    const el = _el('text', { x, y, 'text-anchor': anchor, fill, 'font-size': size });
    el.textContent = content;
    return el;
  };

  const renderMini = (item) => {
    const W = 80, H = 30;
    const svg = _svg(W, H);
    const history = item.priceHistory ?? [];

    if (history.length < 2) {
      svg.appendChild(_text(W / 2, H / 2 + 4, '—', 'middle', 9));
      return svg;
    }

    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const range = Math.max(...prices) - min || 1;
    const pad = 3;

    const pts = history.map((entry, i) => {
      const x = (pad + (i / (history.length - 1)) * (W - pad * 2)).toFixed(1);
      const y = (pad + (1 - (entry.price - min) / range) * (H - pad * 2)).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    svg.appendChild(_el('polyline', { points: pts, fill: 'none', stroke: '#89b4fa', 'stroke-width': '1.5' }));
    return svg;
  };

  const renderFull = (item) => {
    const W = 240, H = 100;
    const PL = 40, PR = 8, PT = 10, PB = 24;
    const svg = _svg(W, H);
    const history = item.priceHistory ?? [];
    const currency = item.currency ?? '€';

    if (history.length < 2) {
      svg.appendChild(_text(W / 2, H / 2, 'Pas assez de données', 'middle', 11));
      return svg;
    }

    const prices = history.map(h => h.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const IW = W - PL - PR;
    const IH = H - PT - PB;
    const n = history.length;

    const tx = (i) => (PL + (i / Math.max(n - 1, 1)) * IW).toFixed(1);
    const ty = (p) => (PT + (1 - (p - minP) / range) * IH).toFixed(1);
    const axisColor = '#45475a';

    // Axes
    svg.appendChild(_el('line', { x1: PL, y1: PT, x2: PL, y2: PT + IH, stroke: axisColor, 'stroke-width': 1 }));
    svg.appendChild(_el('line', { x1: PL, y1: PT + IH, x2: PL + IW, y2: PT + IH, stroke: axisColor, 'stroke-width': 1 }));

    // Y labels
    svg.appendChild(_text(PL - 3, PT + 4, `${currency}${maxP.toFixed(0)}`));
    svg.appendChild(_text(PL - 3, PT + IH, `${currency}${minP.toFixed(0)}`));

    // X labels (dates)
    const fmt = (ts) => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    svg.appendChild(_text(PL, PT + IH + 14, fmt(history[0].seenAt), 'start'));
    svg.appendChild(_text(PL + IW, PT + IH + 14, fmt(history[n - 1].seenAt), 'end'));

    // Polyline
    const pts = history.map((entry, i) => `${tx(i)},${ty(entry.price)}`).join(' ');
    svg.appendChild(_el('polyline', { points: pts, fill: 'none', stroke: '#89b4fa', 'stroke-width': '1.5' }));

    // Points
    for (let i = 0; i < n; i++) {
      svg.appendChild(_el('circle', { cx: tx(i), cy: ty(history[i].price), r: 2.5, fill: '#89b4fa' }));
    }

    return svg;
  };

  return { renderMini, renderFull };
})();
```

- [ ] **Étape 4 : Vérifier que les tests chart passent**

Recharger `tests/test-runner.html`. Tous les tests `price-chart:` doivent être verts.

- [ ] **Étape 5 : Commit**

```bash
git add uc-price-chart.js tests/uc-price-chart.test.js
git commit -m "feat(price-chart): module UCPriceChart — sparklines et graphiques SVG natifs"
```

---

### Tâche 11 : Bouton ⭐, popover seuil et drill-down dans `uc-ui-item.js`

**Fichiers :**
- Modifier : `uc-ui-item.js`

- [ ] **Étape 1 : Rendre `render()` asynchrone et accepter `favorites` dans `ctx`**

Modifier la signature :

```js
  const render = (item, domain, shadowRoot, ctx = {}) => {
```

La fonction reste synchrone. `ctx` reçoit `{ labelDefs, favorites }` où `favorites` est le résultat déjà chargé de `UCFavorites.getAll()`.

- [ ] **Étape 2 : Ajouter le bouton ⭐ dans le HTML de l'article**

Dans `.uc-cart-item__actions`, avant le 🗑, ajouter :

```js
    const isFav = ctx.favorites ? (item.id in ctx.favorites) : false;
```

Et dans le HTML :

```js
          <button class="uc-btn uc-btn--fav ${isFav ? 'uc-btn--fav--active' : ''}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">⭐</button>
```

- [ ] **Étape 3 : Ajouter le listener du bouton ⭐**

Après les listeners existants (open, delete), ajouter :

```js
    const btnFav = el.querySelector('.uc-btn--fav');
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
```

- [ ] **Étape 4 : Ajouter le popover seuil sur les articles favoris**

Après le listener du bouton ⭐, ajouter :

```js
    if (isFav) {
      const settingsBtn = document.createElement('button');
      settingsBtn.className = 'uc-btn uc-btn--fav';
      settingsBtn.title = 'Seuil d\'alerte prix';
      settingsBtn.textContent = '⚙';
      settingsBtn.style.fontSize = '11px';
      el.querySelector('.uc-cart-item__actions').insertBefore(settingsBtn, el.querySelector('.uc-btn--fav'));

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
```

- [ ] **Étape 5 : Ajouter le drill-down graphique sur le nom de l'article**

Rendre la zone `.uc-cart-item__main` cliquable pour afficher/masquer le graphique :

```js
    const mainZone = el.querySelector('.uc-cart-item__main');
    if ((item.priceHistory ?? []).length >= 2) {
      mainZone.style.cursor = 'pointer';
      mainZone.title = 'Voir l\'historique des prix';
      let chartPanel = null;
      mainZone.addEventListener('click', () => {
        if (chartPanel) { chartPanel.remove(); chartPanel = null; return; }
        chartPanel = document.createElement('div');
        chartPanel.className = 'uc-chart-panel';

        const header = document.createElement('div');
        header.className = 'uc-chart-panel__header';
        header.innerHTML = `<button class="uc-chart-panel__back" title="Fermer">←</button><span>${UCUtils.esc(item.name)}</span>`;
        header.querySelector('.uc-chart-panel__back').addEventListener('click', (e) => {
          e.stopPropagation();
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
      });
    }
```

- [ ] **Étape 6 : Vérifier**

Recharger `tests/test-runner.html`. Tests `ui-item:` verts. Tester manuellement sur un article : bouton ⭐ fonctionne, popover seuil s'ouvre, clic sur le nom affiche le graphique.

- [ ] **Étape 7 : Commit**

```bash
git add uc-ui-item.js
git commit -m "feat(ui-item): bouton favori ⭐ + popover seuil + drill-down graphique prix"
```

---

### Tâche 12 : Section Favoris dans `uc-ui-list.js`

**Fichiers :**
- Modifier : `uc-ui-list.js`

- [ ] **Étape 1 : Ajouter `renderFavoritesSection()` dans UCUIList**

```js
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
```

Et l'ajouter au `return` du module :

```js
  return { renderSection, renderFavoritesSection };
```

- [ ] **Étape 2 : Commit**

```bash
git add uc-ui-list.js
git commit -m "feat(ui-list): renderFavoritesSection() — section ⭐ Favoris collapsible"
```

---

### Tâche 13 : Orchestration dans `uc-ui.js` — Favoris + Alertes

**Fichiers :**
- Modifier : `uc-ui.js`

- [ ] **Étape 1 : Mettre à jour la fonction `load` pour charger les favoris**

Remplacer la fonction `load` (déjà modifiée en Phase 1) par :

```js
  const load = async () => {
    try {
      _loadedCarts = await UCCartManager.getAllCarts();
      _labelDefs = await UCLabels.getAllDefs();
      const favorites = await UCFavorites.getAll();

      if (_currentView === 'history') {
        _renderHistory();
      } else {
        const parsed = UCSearch.parse(_currentQuery, _labelDefs);
        const filtered = UCSearch.filter(_loadedCarts, parsed, _labelMode, favorites);
        _render(filtered, favorites);
      }
    } catch (err) {
      console.error(LOG, 'Erreur chargement', err);
      if (_shadow) {
        const cartsEl = _shadow.getElementById('uc-carts');
        if (cartsEl) cartsEl.innerHTML = '<p class="uc-error">Erreur de chargement des données.</p>';
      }
    }
  };
```

- [ ] **Étape 2 : Mettre à jour `_render` pour afficher la section favoris et passer ctx**

Remplacer la fonction `_render` existante par :

```js
  const _render = (carts, favorites = {}) => {
    if (!_shadow) return;
    const cartsEl = _shadow.getElementById('uc-carts');
    const grandTotalEl = _shadow.getElementById('uc-grand-total');
    if (!cartsEl || !grandTotalEl) return;

    cartsEl.innerHTML = '';

    // Total calculé sur les carts complets (non filtrés)
    let grandTotal = 0;
    const currencies = new Set();
    for (const cart of Object.values(_loadedCarts ?? {})) {
      grandTotal += cart.items.filter(i => i.source === 'cart').reduce((s, i) => s + ((i.price ?? 0) * (i.quantity ?? 1)), 0);
      cart.items.filter(i => i.source === 'cart').forEach(i => { if (i.currency) currencies.add(i.currency); });
    }

    if (currencies.size > 1) {
      grandTotalEl.textContent = `Multi-devises (${grandTotal.toFixed(2)})`;
    } else {
      const currency = currencies.size === 1 ? [...currencies][0] : '€';
      grandTotalEl.textContent = `${currency}${grandTotal.toFixed(2)}`;
    }

    const domains = Object.keys(carts ?? {}).filter(d => carts[d]?.items?.length > 0);

    if (domains.length === 0 && Object.keys(favorites).length === 0) {
      cartsEl.innerHTML = '<p class="uc-empty">Aucun panier enregistré.<br>Naviguez vers une page panier et cliquez "Scanner".</p>';
      grandTotalEl.textContent = '—';
      return;
    }

    // Section favoris en premier
    const favSection = UCUIList.renderFavoritesSection(carts, favorites, _labelDefs, _shadow);
    if (favSection) cartsEl.appendChild(favSection);

    // Sections par domaine
    for (const domain of domains.sort()) {
      const cart = carts[domain];
      cartsEl.appendChild(UCUIList.renderSection(domain, cart, _shadow, _labelDefs, favorites));
    }
  };
```

- [ ] **Étape 3 : Mettre à jour `_onScan` pour appeler `checkAlerts`**

Remplacer `_onScan` par :

```js
  const _onScan = async () => {
    if (typeof window._ucScan === 'function') {
      UCUIToast.show(_shadow, 'Scan en cours...', 'info');
      await window._ucScan();
      await _notifyAlerts();
    } else {
      UCUIToast.show(_shadow, 'Scanner non disponible', 'error');
    }
  };

  const _notifyAlerts = async () => {
    try {
      const carts = await UCCartManager.getAllCarts();
      const alerts = await UCFavorites.checkAlerts(carts);
      for (const { item, pct } of alerts) {
        UCUIToast.show(_shadow, `↓ "${item.name}" : -${pct}%`, 'success');
      }
    } catch (err) {
      console.error(LOG, 'checkAlerts échoué', err);
    }
  };
```

- [ ] **Étape 4 : Mettre à jour la signature de `renderSection` dans `uc-ui-list.js`**

```js
  const renderSection = (domain, cart, shadowRoot, labelDefs = {}, favorites = {}) => {
```

Et dans `renderGroup`, passer `favorites` à `UCUIItem.render` :

```js
        itemsContainer.appendChild(UCUIItem.render(item, domain, shadowRoot, { labelDefs, favorites }));
```

Et mettre à jour l'appel dans `_render` de `uc-ui.js` :

```js
      cartsEl.appendChild(UCUIList.renderSection(domain, cart, _shadow, _labelDefs, favorites));
```

- [ ] **Étape 5 : Commit**

```bash
git add uc-ui.js uc-ui-list.js
git commit -m "feat(ui): section favoris + alertes prix au scan + total non-filtré"
```

---

### Tâche 14 : Scan silencieux au démarrage

**Fichiers :**
- Modifier : `uc-ui.js`
- Modifier : `unified-cart.user.js`

- [ ] **Étape 1 : Exposer `window._ucNotifyAlerts` dans `uc-ui.js`**

Dans `_init`, juste avant `await load()` (chargement initial), ajouter :

```js
    window._ucNotifyAlerts = async (alerts) => {
      for (const { item, pct } of (alerts ?? [])) {
        UCUIToast.show(_shadow, `↓ "${UCUtils.esc(item.name)}" : -${pct}%`, 'success');
      }
    };
```

- [ ] **Étape 2 : Appeler `checkAlerts` après l'init UI dans `unified-cart.user.js`**

Dans la fonction `init`, après le bloc `try { await UCUI._init(); } catch...`, ajouter :

```js
    // Alertes favoris silencieuses au chargement
    try {
      const carts = await UCCartManager.getAllCarts();
      const alerts = await UCFavorites.checkAlerts(carts);
      if (alerts.length > 0 && typeof window._ucNotifyAlerts === 'function') {
        window._ucNotifyAlerts(alerts);
      }
    } catch (e) {
      console.warn(LOG, 'Alertes favoris au démarrage échouées', e);
    }
```

- [ ] **Étape 3 : Commit**

```bash
git add uc-ui.js unified-cart.user.js
git commit -m "feat: scan silencieux alertes favoris au chargement de page"
```

---

### Tâche 15 : Version 1.2.0 + déploiement Phase 2

**Fichiers :**
- Modifier : `unified-cart.user.js`

- [ ] **Étape 1 : Bumper la version à 1.2.0**

Changer `@version 1.1.0` → `@version 1.2.0` et toutes les occurrences de `?v=1.1.0` → `?v=1.2.0`.

- [ ] **Étape 2 : Vérifier que tous les tests passent**

Recharger `tests/test-runner.html`. 100% des tests doivent être verts, notamment :
- `labels:` — 11 tests
- `favorites:` — 10 tests
- `search:` — 11 tests
- `price-chart:` — 7 tests
- Tous les tests existants (storage, cart-manager, watchlist, etc.)

- [ ] **Étape 3 : Commit final + push**

```bash
git add unified-cart.user.js
git commit -m "feat: Phase 2 — favoris, alertes prix, graphiques SVG (v1.2.0)"
git push nyx main
```

- [ ] **Étape 4 : Déployer dans Tampermonkey**

Dans Tampermonkey → Dashboard → Unified Cart → Vérifier les mises à jour. Si non proposé, réinstaller depuis :
`https://raw.githubusercontent.com/LK-Nyx/unified-cart/main/unified-cart.user.js`

- [ ] **Étape 5 : Test de smoke complet**

Sur eneba.com ou amazon.fr :
1. Ouvrir la sidebar → searchbar visible, boutons AND/OR présents
2. Scanner la page → articles apparaissent avec badges labels
3. Cliquer ⭐ sur un article → section Favoris apparaît en haut
4. Saisir dans la searchbar → filtre en temps réel
5. Saisir `label:tech` → seuls les articles tech apparaissent
6. Cliquer sur le nom d'un article avec historique → graphique SVG s'affiche
7. Cliquer 📈 → onglet historique global avec sparklines
