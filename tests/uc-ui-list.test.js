const makeCart = (overrides = {}) => ({
  items: [
    { id: 'a1', name: 'Article A', price: 10, currency: '€', url: 'https://shop.com/a', quantity: 1, priceHistory: [] },
    { id: 'a2', name: 'Article B', price: 20, currency: '€', url: 'https://shop.com/b', quantity: 2, priceHistory: [] },
  ],
  lastUpdated: Date.now(),
  ...overrides,
});

const makeShadow2 = () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const sidebar = document.createElement('div');
  sidebar.id = 'uc-sidebar';
  shadow.appendChild(sidebar);
  return { shadow, host };
};

UC_TEST.it('ui-list: renderSection() produit un .uc-cart-section avec domaine', () => {
  const { shadow, host } = makeShadow2();
  const section = UCUIList.renderSection('shop.com', makeCart(), shadow);
  UC_TEST.assert(section.classList.contains('uc-cart-section'));
  UC_TEST.assert(section.querySelector('.uc-cart-section__domain')?.textContent.includes('shop.com'));
  host.remove();
});

UC_TEST.it('ui-list: renderSection() calcule le total correct', () => {
  const { shadow, host } = makeShadow2();
  const section = UCUIList.renderSection('shop.com', makeCart(), shadow);
  const totalEl = section.querySelector('.uc-cart-section__total');
  // total = 10*1 + 20*2 = 50
  UC_TEST.assert(totalEl?.textContent.includes('50.00'), `Total incorrect: ${totalEl?.textContent}`);
  host.remove();
});

UC_TEST.it('ui-list: renderSection() rend tous les articles', () => {
  const { shadow, host } = makeShadow2();
  const section = UCUIList.renderSection('shop.com', makeCart(), shadow);
  const items = section.querySelectorAll('.uc-cart-item');
  UC_TEST.assertEqual(items.length, 2);
  host.remove();
});

UC_TEST.it('ui-list: toggle expand/collapse fonctionne', () => {
  const { shadow, host } = makeShadow2();
  const section = UCUIList.renderSection('shop.com', makeCart(), shadow);
  const header = section.querySelector('.uc-cart-section__header');
  const itemsContainer = section.querySelector('.uc-cart-section__items');

  // Initialement fermé
  UC_TEST.assert(itemsContainer.hidden, 'Section doit être fermée initialement');

  // Clic pour ouvrir
  header.click();
  UC_TEST.assert(!itemsContainer.hidden, 'Section doit être ouverte après clic');

  // Re-clic pour fermer
  header.click();
  UC_TEST.assert(itemsContainer.hidden, 'Section doit être refermée');

  host.remove();
});
