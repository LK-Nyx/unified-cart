const injectCart = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
};

UC_TEST.it('generic: extrait article avec nom + prix + url (score HIGH)', () => {
  const root = injectCart(`
    <div class="cart-item">
      <h3 class="product-title">Chaussures Nike Air Max</h3>
      <span class="price">89,99 €</span>
      <a href="https://shop.com/nike-air-max">Voir</a>
    </div>
  `);
  const items = UCGenericDetector.extract();
  UC_TEST.assert(items.length >= 1, `Attendu ≥1, obtenu ${items.length}`);
  const item = items.find(i => i.name?.includes('Nike'));
  UC_TEST.assert(!!item, 'Article Nike non trouvé');
  UC_TEST.assertEqual(item.price, 89.99);
  UC_TEST.assert(item.url.includes('nike-air-max'));
  root.remove();
});

UC_TEST.it('generic: article sans URL conservé (score MEDIUM)', () => {
  const root = injectCart(`
    <div class="cart-item">
      <h3>Produit sans lien</h3>
      <span class="price">12,00 €</span>
    </div>
  `);
  const items = UCGenericDetector.extract();
  UC_TEST.assert(items.some(i => i.name?.includes('Produit sans lien')), 'Article MEDIUM non retenu');
  root.remove();
});

UC_TEST.it('generic: article sans prix ignoré (score LOW)', () => {
  const root = injectCart(`
    <div class="cart-item">
      <h3>Article sans prix</h3>
    </div>
  `);
  const items = UCGenericDetector.extract();
  UC_TEST.assert(!items.some(i => i.name?.includes('Article sans prix')), 'Article LOW ne devrait pas être retenu');
  root.remove();
});

UC_TEST.it('generic: déduplication des URLs dupliquées', () => {
  const root = injectCart(`
    <div class="cart-item">
      <h3>Produit dupliqué</h3>
      <span class="price">10,00 €</span>
      <a href="https://shop.com/produit">Voir</a>
    </div>
    <div class="cart-item">
      <h3>Produit dupliqué</h3>
      <span class="price">10,00 €</span>
      <a href="https://shop.com/produit">Voir</a>
    </div>
  `);
  const items = UCGenericDetector.extract();
  const dupes = items.filter(i => i.url === 'https://shop.com/produit');
  UC_TEST.assertEqual(dupes.length, 1);
  root.remove();
});

UC_TEST.it('generic: extrait EAN depuis data-ean', () => {
  const root = injectCart(`
    <div class="cart-item" data-ean="1234567890123">
      <h3>Produit avec EAN</h3>
      <span class="price">25,00 €</span>
    </div>
  `);
  const items = UCGenericDetector.extract();
  const item = items.find(i => i.name?.includes('Produit avec EAN'));
  UC_TEST.assertEqual(item?.meta?.ean, '1234567890123');
  root.remove();
});

UC_TEST.it('generic: prix UK (£19.99) parsé correctement', () => {
  const root = injectCart(`
    <div class="cart-item">
      <h3>UK Product</h3>
      <span class="price">£19.99</span>
      <a href="https://shop.co.uk/p">link</a>
    </div>
  `);
  const items = UCGenericDetector.extract();
  const item = items.find(i => i.name?.includes('UK Product'));
  UC_TEST.assertEqual(item?.price, 19.99);
  UC_TEST.assertEqual(item?.currency, '£');
  root.remove();
});
