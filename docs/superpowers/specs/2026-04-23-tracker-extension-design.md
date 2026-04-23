# Unified Cart — Extension Tracker de Shopping

**Date :** 2026-04-23
**Version cible :** 1.1.0
**Statut :** Approuvé

## Contexte

Unified Cart évolue d'un simple regroupeur de paniers vers un tracker de shopping complet. Les features existantes (suivi de prix moteur, source cart/browse, retry, déduplication) restent inchangées. Ce spec couvre trois axes :

1. **Labels** — système de catégorisation mixte (génériques auto + persos)
2. **Barre de recherche** — filtrage universel avec syntaxe `label:X,Y`
3. **Favoris + Alertes prix** — section dédiée + notifications de baisse
4. **Historique des prix UI** — graphiques SVG par article + onglet global

---

## Architecture

### Nouveaux modules (ordre de chargement strict)

```
uc-constants.js         (modifié : UC_CONFIG.GENERIC_LABELS)
uc-storage.js
uc-price-history.js
uc-labels.js            ← NOUVEAU
uc-favorites.js         ← NOUVEAU
uc-cart-manager.js      (modifié : CartItem.labels[])
uc-search.js            ← NOUVEAU
uc-watchlist.js
uc-cart-page.js
uc-generic.js
uc-amazon.js
uc-utils.js
uc-ui-styles.js         (modifié : nouveaux styles)
uc-ui-toast.js
uc-price-chart.js       ← NOUVEAU
uc-ui-item.js           (modifié : bouton ⭐, drill-down)
uc-ui-list.js           (modifié : section Favoris, labels site)
uc-ui.js                (modifié : searchbar, onglet Historique)
```

### Nouvelles clés storage

```js
UC_KEYS.LABEL_DEFS  = 'uc_label_defs'
// { [labelId: string]: { name: string, color: string, createdAt: number } }
// Labels persos uniquement — les génériques sont dans UC_CONFIG.GENERIC_LABELS

UC_KEYS.FAVORITES   = 'uc_favorites'
// { [itemId: string]: { domain: string, alertThreshold: number|null, addedAt: number } }
```

### CartItem — nouveaux champs

```js
{
  // ...champs existants (id, name, price, currency, url, image, quantity, addedAt, priceHistory, meta, source)
  labels: string[]  // IDs de labels appliqués (génériques détectés + persos appliqués)
}
```

Le champ `favorite` n'est **pas** dans CartItem — stocké séparément dans `uc_favorites` pour éviter de polluer la structure cart à chaque mise à jour.

**Invariant labels[] dans mergeCart** : lors d'un merge, les labels génériques (IDs fixes : `tech`, `gaming`…) sont recalculés via `UCLabels.detectGeneric()`. Les labels persos (IDs préfixés `lbl_`) sont préservés depuis l'item existant. Résultat : `labels = preservedUserLabels + freshGenericLabels`.

---

## Module `uc-labels.js` — UCLabels

### Responsabilité

Gérer les définitions de labels persos (CRUD storage) et la détection des labels génériques sur les articles.

### Interface publique

```js
UCLabels.createLabel(name, color)         // → labelId (string), persiste dans uc_label_defs
UCLabels.deleteLabel(labelId)             // supprime du storage
UCLabels.getAllDefs()                     // → { [id]: { name, color } } persos + génériques fusionnés
UCLabels.applyToItem(item, labelId)       // → CartItem avec labels[] mis à jour (immuable)
UCLabels.removeFromItem(item, labelId)    // → CartItem avec labels[] mis à jour (immuable)
UCLabels.detectGeneric(item)             // → string[] IDs génériques matchés sur item.name (lecture seule)
UCLabels.getForDomain(carts, domain)     // → string[] union des labels de tous les articles du domaine
```

### Labels génériques

Définis dans `UC_CONFIG.GENERIC_LABELS` dans `uc-constants.js` :

```js
GENERIC_LABELS: [
  { id: 'tech',        name: 'Technologie',   color: '#3b82f6', keywords: ['gpu','cpu','ssd','ram','pc','laptop','monitor','clavier','souris'] },
  { id: 'gaming',      name: 'Gaming',        color: '#8b5cf6', keywords: ['jeu','game','manette','controller','ps5','xbox','nintendo','steam'] },
  { id: 'audio',       name: 'Audio',         color: '#06b6d4', keywords: ['casque','écouteur','enceinte','microphone','dac','ampli'] },
  { id: 'photo',       name: 'Photo/Vidéo',   color: '#f59e0b', keywords: ['camera','objectif','trépied','drone','gopro'] },
  { id: 'maison',      name: 'Maison',        color: '#10b981', keywords: ['aspirateur','cafetière','frigo','four','lave','électroménager'] },
  { id: 'mode',        name: 'Mode',          color: '#ec4899', keywords: ['veste','pantalon','chaussure','robe','sac','montre'] },
  { id: 'livre',       name: 'Livres',        color: '#84cc16', keywords: ['livre','roman','manga','bd','comic'] },
  { id: 'sport',       name: 'Sport',         color: '#f97316', keywords: ['vélo','raquette','chaussure de sport','tapis','musculation'] },
  { id: 'jardin',      name: 'Jardin/Plantes',color: '#22c55e', keywords: ['plante','pot','terreau','arrosoir','tondeuse','graine'] },
  { id: 'beaute',      name: 'Beauté',        color: '#e879f9', keywords: ['parfum','crème','sérum','mascara','rouge','shampoing'] },
]
```

`detectGeneric(item)` fait un match case-insensitive de chaque keyword contre `item.name`. Retourne les IDs matchés.

### Labels site

`getForDomain()` fait l'union des `item.labels` de tous les articles du domaine. Calculé à la volée au render — jamais stocké.

---

## Module `uc-favorites.js` — UCFavorites

### Responsabilité

Gérer l'ensemble des articles favoris et déclencher les alertes de baisse de prix.

### Interface publique

```js
UCFavorites.add(itemId, domain, threshold)  // threshold = null → alerter sur toute baisse
UCFavorites.remove(itemId)
UCFavorites.isFavorite(itemId)              // → boolean
UCFavorites.getAll()                        // → { [itemId]: { domain, alertThreshold, addedAt } }
UCFavorites.setThreshold(itemId, pct)       // modifie le seuil (nombre entre 0 et 100, ou null)
UCFavorites.checkAlerts(carts)
// → [{ item: CartItem, domain: string, drop: number, pct: number }]
// Compare item.price vs priceHistory[last-1].price pour chaque favori
// Filtre selon alertThreshold si défini
```

### Scan silencieux

`checkAlerts()` est appelé dans `unified-cart.user.js` au démarrage (avant `UCUI._init()`), et après chaque scan manuel dans `UCUI._onScan()`. Les alertes déclenchées sont affichées via `UCUIToast` :

```
↓ "RTX 4090" : -8% (€899 → €829)
```

---

## Module `uc-search.js` — UCSearch

### Responsabilité

Parser les requêtes de recherche et filtrer les carts en mémoire.

### Interface publique

```js
UCSearch.parse(query)
// "gpu rtx label:tech,gaming" →
// { terms: ['gpu', 'rtx'], labels: ['tech', 'gaming'], raw: 'gpu rtx label:tech,gaming' }

UCSearch.filter(carts, parsed, labelMode, favorites)
// → carts filtrés (même structure, articles non-matchants retirés, domaines vides retirés)
// labelMode: 'AND' | 'OR'
// favorites: résultat de UCFavorites.getAll() (pour filtrer dans la section favoris)
```

### Logique de matching

Un article matche si **toutes** les conditions suivantes sont vraies :

- **terms** : chaque terme est présent dans `item.name` (case-insensitive) OU dans `domain`
- **labels** :
  - mode OR → l'article a au moins un des labels demandés
  - mode AND → l'article a tous les labels demandés
- Si `parsed.terms` est vide et `parsed.labels` est vide → tout matche

`parse()` reçoit optionnellement les label defs pour résoudre les noms en IDs : `label:tech` cherche un label dont le `name` contient "tech" (case-insensitive) OU dont l'`id` vaut "tech". Signature complète : `UCSearch.parse(query, labelDefs)`.

### UI — barre de recherche

Positionnée sous `uc-total-bar`, au-dessus de `#uc-carts` :

```
┌─────────────────────────────────────┐
│ 🔍 [________________________] [×]   │
│ Labels: [AND] [OR]   tech × jeux ×  │
└─────────────────────────────────────┘
```

- Filtre en temps réel sur `input` event (données locales, pas de debounce nécessaire)
- Les labels extraits de la query apparaissent comme chips supprimables
- `labelMode` (AND/OR) est un état UI en mémoire, initialisé à OR
- Searchbar vide → re-render complet sans filtre

---

## Module `uc-price-chart.js` — UCPriceChart

### Responsabilité

Rendre des graphiques SVG natifs à partir de `item.priceHistory[]`.

### Interface publique

```js
UCPriceChart.renderMini(item)
// → SVGElement 80×30 sparkline (pour vue liste onglet Historique)

UCPriceChart.renderFull(item)
// → SVGElement 240×80 avec axes Y (prix), axe X (dates), points, ligne, min/max label
```

### Drill-down par article

Clic sur un article dans la sidebar → `UCUIItem` appelle `UCPriceChart.renderFull()` et remplace son contenu par la vue détail :

```
┌─────────────────────────────┐
│ ← Article A — eneba.com     │
│  €35 ┤        •             │
│  €33 ┤   •──•    •──•      │
│  €30 ┤•                    │
│      └──┬──┬──┬──┬──┬──    │
│       Jan Fév Mar Avr Mai   │
│  Min €30 · Max €35 · ↓-14% │
└─────────────────────────────┘
```

Bouton ← pour revenir à la vue liste (re-render normal).

### Onglet Historique global

Bouton `📈` dans le header (à côté des boutons export/import). Clic → remplace `#uc-carts` par la liste de tous les articles ayant ≥2 points de prix, chacun avec son sparkline `renderMini()`. Clic sur un article → drill-down `renderFull()`.

---

## Modifications UI (`uc-ui.js`, `uc-ui-list.js`, `uc-ui-item.js`)

### Structure sidebar

```
Header  (titre + boutons : ↓ ↑ 📈 ◀ ✕)
Total panier (articles source=cart uniquement)
Searchbar + chips AND/OR
─────────────────────────
⭐ Favoris      (N)     ← collapsible, nouvelle section
🛒 Panier       (N)     ← collapsible, existant
👁 Consultés    (N)     ← collapsible, existant
─────────────────────────
Footer (Scanner / + Manuel / Tout vider)
```

### Section Favoris

Rendue par `UCUIList` en premier, avant Panier et Consultés. Construction : `UCSearch.filter()` retourne des carts filtrés → la section Favoris parcourt ces carts filtrés et ne retient que les articles dont l'ID est dans `UCFavorites.getAll()`. Le filtre de recherche s'applique donc naturellement sur les favoris sans logique spéciale.

### Bouton ⭐ sur chaque article

Ajouté dans `UCUIItem.render()` dans `.uc-cart-item__actions`, avant le 🗑. État `filled/outline` selon `UCFavorites.isFavorite(item.id)`. Clic → `UCFavorites.add/remove()` + `UCUIToast` + re-render.

### Popover seuil d'alerte

Sur les articles favoris, un bouton ⚙ ouvre un popover inline :

```
Alerter si baisse > [___]%
[Sauvegarder]  [Annuler]
```

Vide = alerter sur toute baisse.

### Labels sur les articles et sections site

- Chaque article affiche ses labels comme petits badges colorés sous le nom
- Chaque en-tête de domaine affiche les labels du site (union calculée par `UCLabels.getForDomain()`)

---

## Tests

Nouveaux fichiers de test (pattern existant, `UC_TEST.it`) :

```
tests/uc-labels.test.js
tests/uc-favorites.test.js
tests/uc-search.test.js
tests/uc-price-chart.test.js  (rendu SVG : vérifier structure, pas pixel-perfect)
```

Cas à couvrir :

- `UCLabels.detectGeneric` : match case-insensitive, pas de faux positifs
- `UCLabels.getForDomain` : union correcte, domaine vide → []
- `UCFavorites.checkAlerts` : seuil respecté, seuil null → toute baisse, item sans historique → ignoré
- `UCSearch.parse` : syntaxe `label:X,Y`, termes mixtes, query vide
- `UCSearch.filter` : AND vs OR, filtre domaine, article sans labels
- `UCPriceChart.renderMini/Full` : retourne SVGElement, priceHistory < 2 points → graceful

---

## Implémentation (deux phases)

### Phase 1 — Fondation filtrage

1. `uc-constants.js` : ajouter `UC_KEYS.LABEL_DEFS`, `UC_KEYS.FAVORITES`, `UC_CONFIG.GENERIC_LABELS`
2. `uc-labels.js` : module complet + tests
3. `uc-search.js` : module complet + tests
4. `uc-cart-manager.js` : ajouter `labels[]` dans CartItem lors du merge
5. `uc-ui.js` + styles : searchbar + chips AND/OR
6. `uc-ui-item.js` + `uc-ui-list.js` : affichage badges labels
7. Bump version + déploiement

### Phase 2 — Favoris, alertes, graphiques

1. `uc-favorites.js` : module complet + tests
2. `uc-price-chart.js` : module complet + tests
3. `uc-ui-item.js` : bouton ⭐, popover seuil, drill-down
4. `uc-ui-list.js` : section Favoris
5. `uc-ui.js` : onglet 📈, scan silencieux au démarrage
6. `unified-cart.user.js` : appel `checkAlerts()` au démarrage
7. Bump version + déploiement
