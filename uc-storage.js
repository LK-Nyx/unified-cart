// @module uc-storage.js
// [UC:storage] Wrapper atomique autour de GM.getValue/GM.setValue.
// API : get(key) → valeur | null
//       set(key, value) → void
//       update(key, fn) → void  (fn reçoit la valeur actuelle ou null)
//       clear() → void (efface toutes les clés UC_KEYS)

const UCStorage = (() => {
  const LOG = '[UC:storage]';

  const get = async (key) => {
    try {
      const raw = await GM.getValue(key, null);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error(LOG, `get(${key}) échoué`, e);
      return null;
    }
  };

  const set = async (key, value) => {
    try {
      await GM.setValue(key, JSON.stringify(value));
    } catch (e) {
      console.error(LOG, `set(${key}) échoué`, e);
      throw e;
    }
  };

  const update = async (key, fn) => {
    try {
      const current = await get(key);
      const next = fn(current);
      await set(key, next);
    } catch (e) {
      console.error(LOG, `update(${key}) échoué`, e);
      throw e;
    }
  };

  const clear = async () => {
    try {
      for (const key of Object.values(UC_KEYS)) {
        await GM.setValue(key, null);
      }
    } catch (e) {
      console.error(LOG, 'clear() échoué', e);
      throw e;
    }
  };

  return { get, set, update, clear };
})();
