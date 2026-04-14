// @module uc-constants.js
// [UC:constants] Constantes partagées — clés storage, config.
// UC_MESSAGES supprimé : pas de message passing en Tampermonkey.

const UC_KEYS = Object.freeze({
  CARTS:         'carts',
  WATCHED_PAGES: 'watchedPages',
  BTN_POS:       'uc_btn_pos',
  SIDE:          'uc_side',
});

const UC_CONFIG = Object.freeze({
  PRICE_HISTORY_MAX:   100,
  GENERIC_MIN_SCORE:   2,
});
