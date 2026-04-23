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
