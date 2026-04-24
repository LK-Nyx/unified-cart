// @module uc-ai-labels.js
// [UC:ai-labels] Classification automatique d'articles via Claude API (Haiku).
// Dépend de : UCStorage, UCLabels, UCCartManager, UC_KEYS

const UCAutoLabels = (() => {
  const LOG = '[UC:ai-labels]';
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-haiku-4-5-20251001';
  const PALETTE = ['#89b4fa','#a6e3a1','#f9e2af','#f38ba8','#cba6f7','#89dceb','#fab387','#a6adc8','#94e2d5','#eba0ac'];

  const getApiKey = async () => (await UCStorage.get(UC_KEYS.CLAUDE_KEY)) ?? '';
  const setApiKey = async (key) => UCStorage.set(UC_KEYS.CLAUDE_KEY, key.trim());

  // Couleur déterministe par nom de tag (stable entre sessions)
  const _colorForTag = (tag) => {
    let h = 0;
    for (const c of tag) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return PALETTE[Math.abs(h) % PALETTE.length];
  };

  const _callClaude = (apiKey, itemName) => new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'POST',
      url: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      data: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Analyse ce produit et retourne un tableau JSON de tags descriptifs en français, en minuscules (maximum 6 tags). Inclure la catégorie principale, la sous-catégorie, la marque si identifiable, le style ou la technologie si pertinent. Retourner UNIQUEMENT le tableau JSON, sans texte autour.\nProduit : "${itemName}"`,
        }],
      }),
      onload: (r) => {
        try {
          const body = JSON.parse(r.responseText);
          if (body.error) { reject(new Error(body.error.message)); return; }
          const text = body.content?.[0]?.text ?? '[]';
          const match = text.match(/\[[\s\S]*?\]/);
          const tags = match ? JSON.parse(match[0]) : [];
          resolve(
            Array.isArray(tags)
              ? tags.map(t => String(t).toLowerCase().trim()).filter(t => t.length > 1 && t.length < 40)
              : []
          );
        } catch (e) { reject(e); }
      },
      onerror: (e) => reject(new Error('Réseau : ' + JSON.stringify(e))),
      ontimeout: () => reject(new Error('Timeout API Claude')),
    });
  });

  // Résout chaque tag → ID de label existant ou crée un nouveau
  const _resolveLabels = async (tags) => {
    const defs = await UCLabels.getAllDefs();
    const ids = [];
    for (const tag of tags) {
      const found = Object.entries(defs).find(([, d]) => d.name.toLowerCase() === tag.toLowerCase());
      if (found) {
        ids.push(found[0]);
      } else {
        const newId = await UCLabels.createLabel(tag, _colorForTag(tag));
        if (newId) {
          ids.push(newId);
          // Mise à jour du cache local pour les tags suivants du même lot
          defs[newId] = { name: tag, color: _colorForTag(tag) };
        }
      }
    }
    return ids;
  };

  // Classe un seul article. Retourne true si une classification a eu lieu.
  const labelItem = async (domain, item) => {
    if (item.aiLabeled) return false;
    const apiKey = await getApiKey();
    if (!apiKey) return false;

    let tags;
    try {
      tags = await _callClaude(apiKey, item.name);
    } catch (e) {
      console.warn(LOG, `Échec IA pour "${item.name}"`, e.message);
      return false;
    }

    if (!tags.length) return false;

    const newIds = await _resolveLabels(tags);
    const merged = [...new Set([...(item.labels ?? []), ...newIds])];
    await UCCartManager.updateItemLabels(domain, item.id, merged, true);
    console.log(LOG, `"${item.name}" → [${tags.join(', ')}]`);
    return true;
  };

  // Classe tous les articles non encore labelisés d'un domaine.
  const labelDomain = async (domain) => {
    const carts = await UCCartManager.getAllCarts();
    const items = (carts[domain]?.items ?? []).filter(i => !i.aiLabeled);
    let count = 0;
    for (const item of items) {
      const ok = await labelItem(domain, item);
      if (ok) {
        count++;
        // Petite pause pour ne pas saturer l'API
        await new Promise(r => setTimeout(r, 250));
      }
    }
    return count;
  };

  // Classe tous les articles non encore labelisés, tous domaines confondus.
  const labelAll = async (onProgress) => {
    const carts = await UCCartManager.getAllCarts();
    const pending = [];
    for (const [domain, cart] of Object.entries(carts)) {
      for (const item of cart.items ?? []) {
        if (!item.aiLabeled) pending.push({ domain, item });
      }
    }

    let done = 0;
    for (const { domain, item } of pending) {
      const ok = await labelItem(domain, item);
      if (ok) done++;
      onProgress?.(done, pending.length);
      if (pending.length > 1) await new Promise(r => setTimeout(r, 250));
    }
    return done;
  };

  return { labelItem, labelDomain, labelAll, getApiKey, setApiKey };
})();
