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
