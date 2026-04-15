UC_TEST.it('watchlist: add ajoute une URL', async () => {
  GM._reset();
  await UCWatchlist.add('https://example.com/cart', 'example.com', 'generic');
  const pages = await UCWatchlist.getAll();
  UC_TEST.assert('https://example.com/cart' in pages, 'URL absente de la watchlist');
  UC_TEST.assertEqual(pages['https://example.com/cart'].domain, 'example.com');
});

UC_TEST.it('watchlist: add sans url/domain ne plante pas', async () => {
  GM._reset();
  await UCWatchlist.add(null, null, 'generic');
  const pages = await UCWatchlist.getAll();
  UC_TEST.assertDeepEqual(pages, {});
});

UC_TEST.it('watchlist: add deux fois met à jour lastScanned', async () => {
  GM._reset();
  await UCWatchlist.add('https://example.com/cart', 'example.com', 'generic');
  const before = (await UCWatchlist.getAll())['https://example.com/cart'].lastScanned;
  await new Promise(r => setTimeout(r, 10));
  await UCWatchlist.add('https://example.com/cart', 'example.com', 'generic');
  const after = (await UCWatchlist.getAll())['https://example.com/cart'].lastScanned;
  UC_TEST.assert(after >= before, 'lastScanned doit être >= avant');
});

UC_TEST.it('watchlist: remove supprime l\'URL', async () => {
  GM._reset();
  await UCWatchlist.add('https://example.com/cart', 'example.com', 'generic');
  await UCWatchlist.remove('https://example.com/cart');
  const pages = await UCWatchlist.getAll();
  UC_TEST.assertEqual(pages['https://example.com/cart'], undefined);
});

UC_TEST.it('watchlist: updateLastScanned met à jour le timestamp', async () => {
  GM._reset();
  await UCWatchlist.add('https://example.com/cart', 'example.com', 'generic');
  const before = (await UCWatchlist.getAll())['https://example.com/cart'].lastScanned;
  await new Promise(r => setTimeout(r, 10));
  await UCWatchlist.updateLastScanned('https://example.com/cart');
  const after = (await UCWatchlist.getAll())['https://example.com/cart'].lastScanned;
  UC_TEST.assert(after > before, 'updateLastScanned doit mettre à jour le timestamp');
});

UC_TEST.it('watchlist: updateLastScanned URL inconnue ne plante pas', async () => {
  GM._reset();
  await UCWatchlist.updateLastScanned('https://inexistant.com/cart');
  const pages = await UCWatchlist.getAll();
  UC_TEST.assertDeepEqual(pages, {});
});
