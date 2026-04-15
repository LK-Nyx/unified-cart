const makeItem = (price, history = []) => ({
  id: 'test-id', name: 'Article test', price, priceHistory: history,
});

UC_TEST.it('price-history: premier scan = première entrée', () => {
  const item = makeItem(29.99, []);
  const updated = UCPriceHistoryEngine.append(item, 29.99);
  UC_TEST.assertEqual(updated.priceHistory.length, 1);
  UC_TEST.assertEqual(updated.priceHistory[0].price, 29.99);
});

UC_TEST.it('price-history: même prix = pas de nouvelle entrée', () => {
  const item = makeItem(29.99, [{ price: 29.99, seenAt: 1000 }]);
  const updated = UCPriceHistoryEngine.append(item, 29.99);
  UC_TEST.assertEqual(updated.priceHistory.length, 1);
});

UC_TEST.it('price-history: prix différent = nouvelle entrée', () => {
  const item = makeItem(29.99, [{ price: 39.99, seenAt: 1000 }]);
  const updated = UCPriceHistoryEngine.append(item, 29.99);
  UC_TEST.assertEqual(updated.priceHistory.length, 2);
  UC_TEST.assertEqual(updated.priceHistory[1].price, 29.99);
});

UC_TEST.it('price-history: limite à 100 entrées FIFO', () => {
  const history = Array.from({ length: 100 }, (_, i) => ({ price: i + 1, seenAt: i }));
  const item = makeItem(101, history);
  const updated = UCPriceHistoryEngine.append(item, 101);
  UC_TEST.assertEqual(updated.priceHistory.length, 100);
  UC_TEST.assertEqual(updated.priceHistory[0].price, 2);
  UC_TEST.assertEqual(updated.priceHistory[99].price, 101);
});

UC_TEST.it('price-history: tolérance float 0.001', () => {
  const item = makeItem(29.99, [{ price: 29.990001, seenAt: 1000 }]);
  const updated = UCPriceHistoryEngine.append(item, 29.99);
  UC_TEST.assertEqual(updated.priceHistory.length, 1);
});

UC_TEST.it('price-history: trend() détecte baisse', () => {
  const item = makeItem(25, [{ price: 30, seenAt: 1 }, { price: 25, seenAt: 2 }]);
  UC_TEST.assertEqual(UCPriceHistoryEngine.trend(item), 'down');
});

UC_TEST.it('price-history: trend() détecte hausse', () => {
  const item = makeItem(35, [{ price: 30, seenAt: 1 }, { price: 35, seenAt: 2 }]);
  UC_TEST.assertEqual(UCPriceHistoryEngine.trend(item), 'up');
});

UC_TEST.it('price-history: trendLabel() formate ↓ -N%', () => {
  const item = makeItem(27, [{ price: 30, seenAt: 1 }, { price: 27, seenAt: 2 }]);
  const label = UCPriceHistoryEngine.trendLabel(item);
  UC_TEST.assert(label.startsWith('↓'), `attendu ↓, obtenu: ${label}`);
  UC_TEST.assert(label.includes('%'), `attendu %, obtenu: ${label}`);
});

UC_TEST.it('price-history: trendLabel() gère first=0 sans NaN', () => {
  const item = makeItem(10, [{ price: 0, seenAt: 1 }, { price: 10, seenAt: 2 }]);
  const label = UCPriceHistoryEngine.trendLabel(item);
  UC_TEST.assert(!label.includes('NaN') && !label.includes('Infinity'), `label ne doit pas contenir NaN/Infinity : ${label}`);
});
