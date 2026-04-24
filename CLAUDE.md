# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Unified Cart** is a Tampermonkey userscript (`unified-cart.user.js`) that aggregates shopping carts from multiple e-commerce sites into a single sidebar, stored 100% locally via the GM API. No build tools, no npm, no bundler — pure vanilla JS loaded via Tampermonkey `@require` directives.

## Running the tests

Tests run in a browser — open `tests/test-runner.html` directly (e.g. `file:///…/tests/test-runner.html`) or serve it locally. There is no CLI test runner. Results appear in the page and in the browser console under `[UC:test]`.

To run a single test file, temporarily comment out the other `<script src="…test.js">` lines in `test-runner.html`.

## Architecture

### Module load order (strict)

The `@require` order in `unified-cart.user.js` is the dependency order — later modules depend on earlier ones:

```
uc-constants.js       → UC_KEYS, UC_CONFIG, UC_CONFIG.GENERIC_LABELS
uc-storage.js         → UCStorage (wraps GM.getValue/GM.setValue)
uc-price-history.js   → UCPriceHistoryEngine
uc-labels.js          → UCLabels (CRUD labels persos + détection générique)
uc-favorites.js       → UCFavorites (favoris, seuils d'alerte, checkAlerts)
uc-cart-manager.js    → UCCartManager (merge, remove, clear, getAll, updateItemLabels)
uc-ai-labels.js       → UCAutoLabels (classificateur sémantique local + renforcement)
uc-watchlist.js       → UCWatchlist
uc-cart-page.js       → UCCartPageDetector
uc-generic.js         → UCGenericDetector (heuristic fallback adapter)
uc-amazon.js          → UCAdapters.amazon
uc-utils.js           → UCUtils.esc() (XSS escaping)
uc-ui-styles.js       → UC_UI_STYLES (CSS string injectée dans le Shadow DOM)
uc-ui-toast.js        → UCUIToast
uc-search.js          → UCSearch (parse + filter, syntaxe label:X,Y, modes OR/AND)
uc-price-chart.js     → UCPriceChart (renderMini 80×30, renderFull 240×100, SVG natif)
uc-ui-item.js         → UCUIItem (render d'un article : trend, labels, fav, chart, labels popover)
uc-ui-list.js         → UCUIList (render d'une section domaine + section favoris)
uc-ui.js              → UCUI (Shadow DOM, FAB draggable, sidebar orchestrator)
```

### Key design decisions

- **IIFE modules** : every module is `const UCXxx = (() => { ... })()` — no ES modules, no `import/export`. Globals are the interface.
- **Shadow DOM** : the entire UI lives in a shadow root attached to `#uc-root`, isolating it from host-page styles.
- **Single storage layer** : all persistence goes through `UCStorage`. Never call `GM.getValue`/`GM.setValue` directly.
- **Adapters** : site-specific extractors live in `UCAdapters.<name>`. `UCGenericDetector` is the heuristic fallback. Adding a new site = adding a new `UCAdapters.xxx` file and a domain check in `getAdapter()` in `unified-cart.user.js`.
- **`window._ucScan`** : the main `scan()` function is exposed on `window` so `UCUI._onScan` can call it without a circular dependency.
- **`window._ucNotifyAlerts`** : exposed by `UCUI._init()` so `unified-cart.user.js` can push price-drop toasts from outside the module.
- **AbortController on document listeners** : `uc-ui.js` uses an `AbortController` to clean up `document` event listeners on re-init (SPA navigation).
- **Expansion state preservation** : `UCUI._render()` snapshots which sections are open before clearing the DOM and re-expands them after render (prevents collapse on fav toggle or label update).

### Data model (GM storage)

```
carts:            { [domain]: { items: CartItem[], lastUpdated: number } }
watchedPages:     { [url]: { domain, adapter, addedAt, lastScanned } }
uc_label_defs:    { [id]: { name, color, createdAt?, system?, generic? } }
uc_favorites:     { [itemId]: { domain, alertThreshold, addedAt } }
uc_label_weights: { [token]: { [labelId]: number } }   ← poids appris par renforcement
uc_btn_pos:       { x, y }
uc_side:          'left' | 'right'
```

`CartItem` fields : `id, name, price, currency, url, image, quantity, source, addedAt, priceHistory, labels, aiLabeled, meta`.

- `source` : `'cart'` si détecté sur une page panier, `'browse'` sinon.
- `labels` : tableau d'IDs de labels (catégories système ou labels persos).
- `aiLabeled` : booléen — positionné à `true` après classification automatique pour ne pas reclasser.
- `priceHistory` : `[{ price, seenAt }]`, max 100 points.

### Labels — deux niveaux

1. **Catégories système** (IDs fixes comme `'gpu'`, `'vetements'`, `'goth'`) — créées dans `uc_label_defs` par `UCAutoLabels._ensureTaxonomyInStorage()` avec `system: true`.
2. **Labels dynamiques** (IDs `lbl_xxxxx`) — créés à la volée par `UCLabels.createLabel()` soit manuellement soit lors de la classification (tokens résiduels significatifs du nom de l'article).
3. **Renforcement** — `UCAutoLabels.reinforce(item, addedIds, removedIds)` ajuste `uc_label_weights`. Les corrections manuelles de l'utilisateur pèsent sur les classifications futures d'articles aux noms similaires.

### Classification automatique (UCAutoLabels)

Déclenchée après chaque `mergeCart()`, en arrière-plan, uniquement sur les articles `aiLabeled !== true`.

Pipeline :
1. Scoring taxonomie (30 catégories, mots déclencheurs mono et bigrammes)
2. Détection de marques et alias (`'rtx'` → NVIDIA, `'ryzen'` → AMD…)
3. Boost domaine (zalando → vetements, decathlon → sport…)
4. Ajout des poids appris par renforcement
5. Catégories retenues si score ≥ 2
6. Tokens résiduels significatifs → labels dynamiques (cap à 5)

### Test infrastructure

- `tests/test-runner.js` — custom zero-dependency runner (`UC_TEST.it/assert/assertEqual/assertDeepEqual/assertThrows/run`)
- `tests/mocks/gm-mock.js` — in-memory `GM` mock avec `GM._reset()` et `GM._dump()` helpers ; mock `GM_openInTab`
- Chaque fichier de test appelle `UC_TEST.it(name, async fn)` directement ; `UC_TEST.run()` est appelé une seule fois à la fin de `test-runner.html`

### Logging convention

Every module prefixes its console output with `[UC:modulename]` (e.g. `[UC:cart]`, `[UC:ui]`, `[UC:smart-labels]`). Match this pattern in new modules.
