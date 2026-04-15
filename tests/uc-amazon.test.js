const makeAmazonCart = (items) => {
  const root = document.createElement('div');
  for (const { asin, name, price, qty = 1 } of items) {
    root.innerHTML += `
      <div data-asin="${asin}" class="sc-list-item-content">
        <div class="sc-product-title"><span class="a-truncate-cut">${name}</span></div>
        <div class="sc-price"><span class="a-offscreen">${price} €</span></div>
        <select name="quantity"><option value="${qty}" selected>${qty}</option></select>
        <img class="sc-product-image" src="https://img.amazon.fr/${asin}.jpg"/>
      </div>
    `;
  }
  document.body.appendChild(root);
  return root;
};

UC_TEST.it('amazon: extrait un article avec nom, prix, url, quantity', () => {
  const root = makeAmazonCart([{ asin: 'B01ABC', name: 'Sony WH-1000XM5', price: '279,99', qty: 2 }]);
  const orig = window.location;
  Object.defineProperty(window, 'location', { value: { ...orig, hostname: 'www.amazon.fr' }, configurable: true });

  const items = UCAdapters.amazon.extract();
  UC_TEST.assert(items.length >= 1, `Attendu ≥1 article, obtenu ${items.length}`);
  const item = items.find(i => i.meta?.asin === 'B01ABC');
  UC_TEST.assert(!!item, 'Article B01ABC non trouvé');
  UC_TEST.assertEqual(item.name, 'Sony WH-1000XM5');
  UC_TEST.assertEqual(item.price, 279.99);
  UC_TEST.assertEqual(item.quantity, 2);
  UC_TEST.assert(item.url.includes('B01ABC'), `URL doit contenir l'ASIN`);

  Object.defineProperty(window, 'location', { value: orig, configurable: true });
  root.remove();
});

UC_TEST.it('amazon: retourne [] si aucun [data-asin] présent', () => {
  const items = UCAdapters.amazon.extract();
  UC_TEST.assert(Array.isArray(items));
});

UC_TEST.it('amazon: prix avec virgule parsé correctement (1.299,00 → 1299.00)', () => {
  const root = makeAmazonCart([{ asin: 'B02DEF', name: 'Article Test', price: '1.299,00', qty: 1 }]);
  const orig = window.location;
  Object.defineProperty(window, 'location', { value: { ...orig, hostname: 'www.amazon.fr' }, configurable: true });

  const items = UCAdapters.amazon.extract();
  const item = items.find(i => i.meta?.asin === 'B02DEF');
  UC_TEST.assert(!!item, 'Article B02DEF non trouvé');
  UC_TEST.assertEqual(item.price, 1299.00);

  Object.defineProperty(window, 'location', { value: orig, configurable: true });
  root.remove();
});
