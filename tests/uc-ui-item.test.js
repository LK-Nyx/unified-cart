const makeItem = (overrides = {}) => ({
  id: 'item-1', name: 'Produit Test', price: 29.99, currency: '€',
  url: 'https://example.com/p', quantity: 2,
  priceHistory: [{ price: 35, seenAt: 1000 }, { price: 29.99, seenAt: 2000 }],
  ...overrides,
});

const makeShadow = () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const sidebar = document.createElement('div');
  sidebar.id = 'uc-sidebar';
  shadow.appendChild(sidebar);
  return { shadow, host };
};

UC_TEST.it('ui-item: render() produit un .uc-cart-item avec nom et prix', () => {
  const { shadow, host } = makeShadow();
  const item = makeItem();
  const el = UCUIItem.render(item, 'example.com', shadow);
  UC_TEST.assert(el.classList.contains('uc-cart-item'), 'Classe uc-cart-item manquante');
  UC_TEST.assert(el.querySelector('.uc-cart-item__name')?.textContent.includes('Produit Test'));
  UC_TEST.assert(el.querySelector('.uc-cart-item__price')?.textContent.includes('29.99'));
  host.remove();
});

UC_TEST.it('ui-item: render() affiche le bouton ouvrir si url présente', () => {
  const { shadow, host } = makeShadow();
  const el = UCUIItem.render(makeItem(), 'example.com', shadow);
  UC_TEST.assert(!!el.querySelector('.uc-btn--open'), 'Bouton ouvrir absent');
  host.remove();
});

UC_TEST.it('ui-item: render() sans url = pas de bouton ouvrir', () => {
  const { shadow, host } = makeShadow();
  const el = UCUIItem.render(makeItem({ url: null }), 'example.com', shadow);
  UC_TEST.assert(!el.querySelector('.uc-btn--open'), 'Bouton ouvrir présent sans URL');
  host.remove();
});

UC_TEST.it('ui-item: render() affiche la tendance baisse', () => {
  const { shadow, host } = makeShadow();
  const el = UCUIItem.render(makeItem(), 'example.com', shadow);
  const trend = el.querySelector('.uc-cart-item__trend');
  UC_TEST.assert(trend?.classList.contains('trend--down'), 'Tendance baisse non détectée');
  host.remove();
});

UC_TEST.it('ui-item: render() quantité > 1 affichée', () => {
  const { shadow, host } = makeShadow();
  const el = UCUIItem.render(makeItem({ quantity: 3 }), 'example.com', shadow);
  UC_TEST.assert(el.querySelector('.uc-cart-item__price')?.textContent.includes('×3'));
  host.remove();
});
