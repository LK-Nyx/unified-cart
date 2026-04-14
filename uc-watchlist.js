// @module uc-watchlist.js
// [UC:watchlist] Gestion de la liste des pages à re-scanner automatiquement.
// Dépend de : UCStorage, UC_KEYS

const UCWatchlist = (() => {
  const LOG = '[UC:watchlist]';

  const add = async (url, domain, adapter) => {
    if (!url || !domain) {
      console.warn(LOG, 'add() : url ou domain manquant', { url, domain });
      return;
    }
    await UCStorage.update(UC_KEYS.WATCHED_PAGES, (pages) => {
      const all = pages ?? {};
      if (all[url]) return { ...all, [url]: { ...all[url], lastScanned: Date.now() } };
      console.log(LOG, `Nouvelle page surveillée : ${url} [${adapter}]`);
      return { ...all, [url]: { domain, adapter, addedAt: Date.now(), lastScanned: Date.now() } };
    });
  };

  const getAll = async () => {
    return (await UCStorage.get(UC_KEYS.WATCHED_PAGES)) ?? {};
  };

  const updateLastScanned = async (url) => {
    await UCStorage.update(UC_KEYS.WATCHED_PAGES, (pages) => {
      const all = pages ?? {};
      if (!all[url]) return all;
      return { ...all, [url]: { ...all[url], lastScanned: Date.now() } };
    });
  };

  const remove = async (url) => {
    await UCStorage.update(UC_KEYS.WATCHED_PAGES, (pages) => {
      const all = pages ?? {};
      const { [url]: _, ...rest } = all;
      return rest;
    });
    console.log(LOG, `Page retirée de la watchlist : ${url}`);
  };

  return { add, getAll, updateLastScanned, remove };
})();
