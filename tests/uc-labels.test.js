// tests/uc-labels.test.js

UC_TEST.it('labels: detectGeneric() détecte "gpu" → tech', () => {
  const item = { name: 'RTX 4090 GPU 24Go', labels: [] };
  const ids = UCLabels.detectGeneric(item);
  UC_TEST.assert(ids.includes('tech'), `Attendu 'tech' dans ${JSON.stringify(ids)}`);
});

UC_TEST.it('labels: detectGeneric() case-insensitive', () => {
  const item = { name: 'CASQUE Gaming RGB', labels: [] };
  const ids = UCLabels.detectGeneric(item);
  UC_TEST.assert(ids.includes('audio') || ids.includes('gaming'), `Attendu audio ou gaming dans ${JSON.stringify(ids)}`);
});

UC_TEST.it('labels: detectGeneric() retourne [] pour nom quelconque', () => {
  const item = { name: 'Produit inconnu 42', labels: [] };
  const ids = UCLabels.detectGeneric(item);
  UC_TEST.assertEqual(ids.length, 0);
});

UC_TEST.it('labels: applyToItem() ajoute un label (immuable)', () => {
  const item = { id: '1', name: 'Test', labels: [] };
  const updated = UCLabels.applyToItem(item, 'tech');
  UC_TEST.assert(updated.labels.includes('tech'), 'Label non ajouté');
  UC_TEST.assertEqual(item.labels.length, 0, 'Item original muté');
});

UC_TEST.it('labels: applyToItem() ne duplique pas un label existant', () => {
  const item = { id: '1', name: 'Test', labels: ['tech'] };
  const updated = UCLabels.applyToItem(item, 'tech');
  UC_TEST.assertEqual(updated.labels.length, 1);
});

UC_TEST.it('labels: removeFromItem() retire un label (immuable)', () => {
  const item = { id: '1', name: 'Test', labels: ['tech', 'gaming'] };
  const updated = UCLabels.removeFromItem(item, 'tech');
  UC_TEST.assert(!updated.labels.includes('tech'), 'Label non retiré');
  UC_TEST.assert(updated.labels.includes('gaming'), 'Autre label perdu');
  UC_TEST.assertEqual(item.labels.length, 2, 'Item original muté');
});

UC_TEST.it('labels: getForDomain() retourne union des labels', () => {
  const carts = {
    'example.com': {
      items: [
        { id: '1', name: 'A', labels: ['tech', 'gaming'] },
        { id: '2', name: 'B', labels: ['gaming', 'audio'] },
      ]
    }
  };
  const labels = UCLabels.getForDomain(carts, 'example.com');
  UC_TEST.assert(labels.includes('tech'), 'tech manquant');
  UC_TEST.assert(labels.includes('gaming'), 'gaming manquant');
  UC_TEST.assert(labels.includes('audio'), 'audio manquant');
  UC_TEST.assertEqual(labels.length, 3);
});

UC_TEST.it('labels: getForDomain() retourne [] pour domaine vide', () => {
  const carts = {};
  const labels = UCLabels.getForDomain(carts, 'nonexistent.com');
  UC_TEST.assertEqual(labels.length, 0);
});

UC_TEST.it('labels: createLabel() persiste et retourne un id', async () => {
  GM._reset();
  const id = await UCLabels.createLabel('Promo', '#ff0000');
  UC_TEST.assert(typeof id === 'string' && id.startsWith('lbl_'), `ID invalide: ${id}`);
  const defs = await UCLabels.getAllDefs();
  UC_TEST.assert(id in defs, 'Label non trouvé dans defs');
  UC_TEST.assertEqual(defs[id].name, 'Promo');
  UC_TEST.assertEqual(defs[id].color, '#ff0000');
});

UC_TEST.it('labels: getAllDefs() fusionne génériques + persos', async () => {
  GM._reset();
  const id = await UCLabels.createLabel('Perso', '#abc');
  const defs = await UCLabels.getAllDefs();
  UC_TEST.assert('tech' in defs, 'Label générique tech manquant');
  UC_TEST.assert(id in defs, 'Label perso manquant');
  UC_TEST.assert(defs['tech'].generic === true, 'Flag generic manquant sur tech');
  UC_TEST.assert(!defs[id].generic, 'Flag generic présent sur label perso');
});

UC_TEST.it('labels: deleteLabel() supprime du storage', async () => {
  GM._reset();
  const id = await UCLabels.createLabel('Temp', '#000');
  await UCLabels.deleteLabel(id);
  const defs = await UCLabels.getAllDefs();
  UC_TEST.assert(!(id in defs), 'Label encore présent après suppression');
});
