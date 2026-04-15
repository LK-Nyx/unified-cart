const initUI = async () => {
  GM._reset();
  // Nettoyer un éventuel root précédent
  document.getElementById('uc-root')?.remove();
  await UCUI._init();
  return document.getElementById('uc-root')?.shadowRoot;
};

UC_TEST.it('ui: _init() injecte le shadow root dans le body', async () => {
  const shadow = await initUI();
  UC_TEST.assert(!!shadow, 'Shadow root absent');
  UC_TEST.assert(!!shadow.getElementById('uc-sidebar'), 'Sidebar absente');
  UC_TEST.assert(!!shadow.getElementById('uc-fab'), 'FAB absent');
  document.getElementById('uc-root')?.remove();
});

UC_TEST.it('ui: _init() idempotent (double appel ne crée pas deux roots)', async () => {
  document.getElementById('uc-root')?.remove();
  await UCUI._init();
  await UCUI._init();
  UC_TEST.assertEqual(document.querySelectorAll('#uc-root').length, 1);
  document.getElementById('uc-root')?.remove();
});

UC_TEST.it('ui: _toggle() affiche et cache la sidebar', async () => {
  const shadow = await initUI();
  const sidebar = shadow.getElementById('uc-sidebar');

  // Initialement cachée
  UC_TEST.assert(sidebar.classList.contains('uc-sidebar--hidden'), 'Sidebar doit être cachée');

  UCUI._toggle();
  UC_TEST.assert(!sidebar.classList.contains('uc-sidebar--hidden'), 'Sidebar doit être visible');

  UCUI._toggle();
  UC_TEST.assert(sidebar.classList.contains('uc-sidebar--hidden'), 'Sidebar doit être recachée');

  document.getElementById('uc-root')?.remove();
});

UC_TEST.it('ui: load() affiche le message vide si aucun panier', async () => {
  GM._reset();
  const shadow = await initUI();
  await UCUI.load();
  const cartsEl = shadow.getElementById('uc-carts');
  UC_TEST.assert(cartsEl.innerHTML.includes('Aucun panier'), `Message vide absent : ${cartsEl.innerHTML}`);
  document.getElementById('uc-root')?.remove();
});

UC_TEST.it('ui: load() affiche les paniers si données présentes', async () => {
  GM._reset();
  await UCCartManager.mergeCart('shop.com', [
    { name: 'Produit X', price: 49.99, currency: '€', url: 'https://shop.com/x', quantity: 1 },
  ]);
  const shadow = await initUI();
  await UCUI.load();
  const cartsEl = shadow.getElementById('uc-carts');
  UC_TEST.assert(cartsEl.querySelector('.uc-cart-section') !== null, 'Section panier absente');
  document.getElementById('uc-root')?.remove();
});

UC_TEST.it('ui: touche Escape ferme la sidebar', async () => {
  const shadow = await initUI();
  const sidebar = shadow.getElementById('uc-sidebar');

  // Ouvrir d'abord
  UCUI._toggle();
  UC_TEST.assert(!sidebar.classList.contains('uc-sidebar--hidden'));

  // Escape
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  UC_TEST.assert(sidebar.classList.contains('uc-sidebar--hidden'), 'Escape doit fermer la sidebar');

  document.getElementById('uc-root')?.remove();
});

UC_TEST.it('ui: switch côté left/right', async () => {
  GM._reset();
  const shadow = await initUI();
  const sidebar = shadow.getElementById('uc-sidebar');
  const btnSide = shadow.getElementById('uc-btn-side');

  UC_TEST.assert(!sidebar.classList.contains('uc-side--left'), 'Côté initial doit être droit');
  btnSide.click();
  UC_TEST.assert(sidebar.classList.contains('uc-side--left'), 'Doit passer à gauche');
  btnSide.click();
  UC_TEST.assert(!sidebar.classList.contains('uc-side--left'), 'Doit repasser à droite');

  document.getElementById('uc-root')?.remove();
});
