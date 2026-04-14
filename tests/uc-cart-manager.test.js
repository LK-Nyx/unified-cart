UC_TEST.it('cart-manager: mergeCart ajoute un nouvel article', async () => {
  GM._reset();
  await UCCartManager.mergeCart('example.com', [
    { name: 'Produit A', price: 19.99, currency: '€', url: 'https://example.com/a', quantity: 1 },
  ]);
  const carts = await UCCartManager.getAllCarts();
  UC_TEST.assertEqual(carts['example.com'].items.length, 1);
  UC_TEST.assertEqual(carts['example.com'].items[0].name, 'Produit A');
});

UC_TEST.it('cart-manager: mergeCart met à jour le prix existant', async () => {
  GM._reset();
  await UCCartManager.mergeCart('example.com', [
    { name: 'Produit A', price: 19.99, currency: '€', url: 'https://example.com/a', quantity: 1 },
  ]);
  await UCCartManager.mergeCart('example.com', [
    { name: 'Produit A', price: 24.99, currency: '€', url: 'https://example.com/a', quantity: 1 },
  ]);
  const carts = await UCCartManager.getAllCarts();
  UC_TEST.assertEqual(carts['example.com'].items.length, 1);
  UC_TEST.assertEqual(carts['example.com'].items[0].price, 24.99);
  UC_TEST.assertEqual(carts['example.com'].items[0].priceHistory.length, 2);
});

UC_TEST.it('cart-manager: removeItem retire l\'article', async () => {
  GM._reset();
  await UCCartManager.mergeCart('example.com', [
    { name: 'Produit A', price: 19.99, currency: '€', url: 'https://example.com/a', quantity: 1 },
  ]);
  const carts = await UCCartManager.getAllCarts();
  const id = carts['example.com'].items[0].id;
  await UCCartManager.removeItem('example.com', id);
  const updated = await UCCartManager.getAllCarts();
  UC_TEST.assertEqual(updated['example.com'].items.length, 0);
});

UC_TEST.it('cart-manager: clearCart supprime le domaine', async () => {
  GM._reset();
  await UCCartManager.mergeCart('example.com', [
    { name: 'Produit A', price: 10, currency: '€', url: 'https://example.com/a', quantity: 1 },
  ]);
  await UCCartManager.clearCart('example.com');
  const carts = await UCCartManager.getAllCarts();
  UC_TEST.assertEqual(carts['example.com'], undefined);
});

UC_TEST.it('cart-manager: article sans nom est ignoré', async () => {
  GM._reset();
  await UCCartManager.mergeCart('example.com', [
    { price: 10, currency: '€', url: 'https://example.com/a', quantity: 1 },
  ]);
  const carts = await UCCartManager.getAllCarts();
  UC_TEST.assertEqual(Object.keys(carts).length, 0);
});
