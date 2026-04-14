// Mock GM API pour les tests — remplace Tampermonkey GM.getValue/GM.setValue
const _gm_store = {};

const GM = {
  getValue: (key, defaultValue = null) =>
    Promise.resolve(key in _gm_store ? _gm_store[key] : defaultValue),
  setValue: (key, value) => {
    if (value === null || value === undefined) {
      delete _gm_store[key];
    } else {
      _gm_store[key] = value;
    }
    return Promise.resolve();
  },
  _reset: () => { Object.keys(_gm_store).forEach(k => delete _gm_store[k]); },
  _dump: () => ({ ..._gm_store }),
};

// Mock GM_openInTab
let _lastOpenedTab = null;
const GM_openInTab = (url, opts) => { _lastOpenedTab = url; };
const _getLastTab = () => _lastOpenedTab;
const _resetTab = () => { _lastOpenedTab = null; };
