// @module uc-constants.js
// [UC:constants] Constantes partagées — clés storage, config.

const UC_KEYS = Object.freeze({
  CARTS:         'carts',
  WATCHED_PAGES: 'watchedPages',
  BTN_POS:       'uc_btn_pos',
  SIDE:          'uc_side',
  LABEL_DEFS:    'uc_label_defs',
  FAVORITES:     'uc_favorites',
});

const UC_CONFIG = Object.freeze({
  PRICE_HISTORY_MAX: 100,
  GENERIC_MIN_SCORE: 2,
  GENERIC_LABELS: [
    { id: 'tech',    name: 'Technologie',    color: '#3b82f6', keywords: ['gpu','cpu','ssd','ram','pc','laptop','monitor','clavier','souris','écran','processeur','carte graphique'] },
    { id: 'gaming',  name: 'Gaming',         color: '#8b5cf6', keywords: ['jeu','game','manette','controller','ps5','xbox','nintendo','steam','gaming'] },
    { id: 'audio',   name: 'Audio',          color: '#06b6d4', keywords: ['casque','écouteur','enceinte','microphone','dac','ampli','hifi','audio'] },
    { id: 'photo',   name: 'Photo/Vidéo',    color: '#f59e0b', keywords: ['camera','objectif','trépied','drone','gopro','appareil photo','caméra'] },
    { id: 'maison',  name: 'Maison',         color: '#10b981', keywords: ['aspirateur','cafetière','frigo','four','lave','électroménager','robot'] },
    { id: 'mode',    name: 'Mode',           color: '#ec4899', keywords: ['veste','pantalon','chaussure','robe','sac','montre','vêtement','sneaker'] },
    { id: 'livre',   name: 'Livres',         color: '#84cc16', keywords: ['livre','roman','manga','bd','comic','bande dessinée'] },
    { id: 'sport',   name: 'Sport',          color: '#f97316', keywords: ['vélo','raquette','musculation','fitness','yoga','tapis de sport','haltère'] },
    { id: 'jardin',  name: 'Jardin/Plantes', color: '#22c55e', keywords: ['plante','pot','terreau','arrosoir','tondeuse','graine','jardinage'] },
    { id: 'beaute',  name: 'Beauté',         color: '#e879f9', keywords: ['parfum','crème','sérum','mascara','rouge','shampoing','cosmétique'] },
  ],
});
