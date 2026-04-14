UC_TEST.it('storage: set puis get retourne la valeur', async () => {
  GM._reset();
  await UCStorage.set('foo', 'bar');
  const r = await UCStorage.get('foo');
  UC_TEST.assertEqual(r, 'bar');
});

UC_TEST.it('storage: get clé absente retourne null', async () => {
  GM._reset();
  const r = await UCStorage.get('inexistant');
  UC_TEST.assertEqual(r, null);
});

UC_TEST.it('storage: update applique la fonction de transformation', async () => {
  GM._reset();
  await UCStorage.set('counter', 5);
  await UCStorage.update('counter', v => (v ?? 0) + 1);
  const r = await UCStorage.get('counter');
  UC_TEST.assertEqual(r, 6);
});

UC_TEST.it('storage: update sur clé absente reçoit null', async () => {
  GM._reset();
  await UCStorage.update('newKey', v => v ?? 'default');
  const r = await UCStorage.get('newKey');
  UC_TEST.assertEqual(r, 'default');
});

UC_TEST.it('storage: clear vide toutes les clés UC_KEYS', async () => {
  GM._reset();
  await UCStorage.set(UC_KEYS.CARTS, { test: true });
  await UCStorage.set(UC_KEYS.WATCHED_PAGES, { url: {} });
  await UCStorage.clear();
  const r1 = await UCStorage.get(UC_KEYS.CARTS);
  const r2 = await UCStorage.get(UC_KEYS.WATCHED_PAGES);
  UC_TEST.assertEqual(r1, null);
  UC_TEST.assertEqual(r2, null);
});
