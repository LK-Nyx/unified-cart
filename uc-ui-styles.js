// @module uc-ui-styles.js
// [UC:ui] CSS string injectée dans le Shadow DOM de la sidebar.

const UC_UI_STYLES = `
/* ── Reset & variables ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:host {
  --bg:       #1e1e2e;
  --surface:  #313244;
  --border:   #45475a;
  --text:     #cdd6f4;
  --muted:    #6c7086;
  --accent:   #89b4fa;
  --green:    #a6e3a1;
  --red:      #f38ba8;
  --yellow:   #f9e2af;
  --radius:   6px;
  --font:     'Segoe UI', system-ui, sans-serif;
}

/* ── Sidebar wrapper ── */
#uc-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: auto;
  width: 380px;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  z-index: 2147483647;
  border-left: 1px solid var(--border);
  transition: right .2s, left .2s;
  overflow: hidden;
}

#uc-sidebar.uc-side--left {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 1px solid var(--border);
}

/* ── Header ── */
.uc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .6rem .75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.uc-header__title { font-weight: 700; font-size: 14px; color: var(--accent); }
.uc-header__actions { display: flex; gap: .35rem; }

/* ── Carts container ── */
.uc-carts {
  padding: .5rem 0;
  overflow-y: auto;
  flex: 1;
}

.uc-empty { color: var(--muted); padding: 1rem .75rem; font-style: italic; }
.uc-error { color: var(--red); padding: 1rem .75rem; }

/* ── Cart section ── */
.uc-cart-section { border-bottom: 1px solid var(--border); }

.uc-cart-section__header {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .5rem .75rem;
  cursor: pointer;
  user-select: none;
  transition: background .15s;
}

.uc-cart-section__header:hover { background: var(--surface); }

.uc-cart-section__toggle { color: var(--muted); font-size: 10px; width: 10px; }
.uc-cart-section__domain { font-weight: 600; flex: 1; color: var(--accent); }
.uc-cart-section__count { color: var(--muted); font-size: 11px; margin-left: auto; }

.uc-cart-section__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .35rem .75rem .5rem;
  background: var(--surface);
}

.uc-cart-section__updated { color: var(--muted); font-size: 11px; }

/* ── Group label ── */
.uc-items-group__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--muted);
  padding: .35rem .75rem .1rem 1.5rem;
}

/* ── Cart item ── */
.uc-cart-item {
  padding: .4rem .75rem .4rem 1.5rem;
  border-top: 1px solid var(--border);
}

.uc-cart-item:first-child { border-top: none; }

.uc-cart-item__main {
  display: flex;
  align-items: baseline;
  gap: .5rem;
}

.uc-cart-item__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

.uc-cart-item__price { font-weight: 600; white-space: nowrap; }

.uc-cart-item__meta {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-top: .2rem;
}

.uc-cart-item__trend { font-size: 11px; }
.trend--down { color: var(--green); }
.trend--up   { color: var(--red); }
.trend--stable { color: var(--muted); }

.uc-cart-item__actions { margin-left: auto; display: flex; gap: .25rem; }

/* ── Buttons ── */
.uc-btn {
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font);
  font-size: 12px;
  padding: .3rem .6rem;
  transition: opacity .15s, background .15s;
}

.uc-btn:hover { opacity: .85; }
.uc-btn:active { opacity: .7; }

.uc-btn--primary   { background: var(--accent); color: var(--bg); font-weight: 600; }
.uc-btn--secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
.uc-btn--danger    { background: transparent; color: var(--red); border: 1px solid var(--red); font-size: 11px; }
.uc-btn--icon      { background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: .25rem .5rem; font-size: 14px; }

/* ── Footer ── */
.uc-footer {
  display: flex;
  gap: .5rem;
  padding: .6rem .75rem;
  border-top: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}

.uc-footer .uc-btn--primary,
.uc-footer .uc-btn--secondary { flex: 1; }

/* ── Manual form ── */
.uc-manual-form {
  padding: .75rem;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.uc-manual-form__title { font-weight: 700; margin-bottom: .5rem; color: var(--accent); }
.uc-manual-form__actions { display: flex; gap: .5rem; margin-top: .5rem; }
.uc-manual-form__actions .uc-btn { flex: 1; }

.uc-input {
  display: block;
  width: 100%;
  padding: .35rem .5rem;
  margin-bottom: .35rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font);
  font-size: 12px;
}

.uc-input:focus { outline: none; border-color: var(--accent); }

/* ── Floating button ── */
#uc-fab {
  position: absolute;
  bottom: 24px;
  right: 24px;
  pointer-events: auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--bg);
  font-size: 22px;
  border: none;
  cursor: pointer;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.4);
  transition: opacity .15s, transform .15s;
  user-select: none;
}

#uc-fab:hover { opacity: .9; transform: scale(1.05); }
#uc-fab:active { opacity: .75; transform: scale(.97); }

/* ── Toasts ── */
#uc-toast-container {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  pointer-events: none;
  width: max-content;
}

.uc-toast {
  padding: .4rem .8rem;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity .2s, transform .2s;
}

.uc-toast--visible { opacity: 1; transform: translateY(0); }
.uc-toast--info    { background: var(--accent); color: var(--bg); }
.uc-toast--success { background: var(--green); color: var(--bg); }
.uc-toast--error   { background: var(--red); color: var(--bg); }

/* ── Searchbar ── */
.uc-searchbar {
  padding: .4rem .75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.uc-searchbar__row {
  display: flex;
  align-items: center;
  gap: .4rem;
}

.uc-searchbar__icon { color: var(--muted); font-size: 13px; }

.uc-searchbar__input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font);
  font-size: 12px;
  padding: .25rem .4rem;
}

.uc-searchbar__input:focus { outline: none; border-color: var(--accent); }

.uc-searchbar__clear {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0 .2rem;
  line-height: 1;
}

.uc-searchbar__clear:hover { color: var(--text); }

.uc-searchbar__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .3rem;
  margin-top: .35rem;
  min-height: 0;
}

.uc-searchbar__chips:empty { display: none; }

.uc-label-mode {
  display: flex;
  gap: .2rem;
  margin-right: .2rem;
}

.uc-label-mode__btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--muted);
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  padding: .1rem .35rem;
  text-transform: uppercase;
}

.uc-label-mode__btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.uc-chip {
  display: inline-flex;
  align-items: center;
  gap: .2rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 10px;
  padding: .1rem .4rem;
  color: var(--text);
}

.uc-chip__remove {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}

.uc-chip__remove:hover { color: var(--red); }

/* ── Label badges ── */
.uc-label-badges {
  display: flex;
  flex-wrap: wrap;
  gap: .2rem;
  margin-top: .2rem;
}

.uc-label-badge {
  font-size: 9px;
  font-weight: 700;
  padding: .05rem .3rem;
  border-radius: 99px;
  color: #fff;
  opacity: .85;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ── Section Favoris ── */
.uc-favorites-section {
  border-bottom: 2px solid var(--accent);
}

.uc-favorites-section .uc-cart-section__domain { color: var(--yellow); }

/* ── Bouton favori ── */
.uc-btn--fav {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0 .2rem;
  line-height: 1;
  opacity: .5;
  transition: opacity .15s, transform .15s;
}

.uc-btn--fav:hover { opacity: 1; transform: scale(1.15); }
.uc-btn--fav--active { opacity: 1; color: var(--yellow); }

/* ── Popover seuil alerte ── */
.uc-threshold-popover {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: .5rem .6rem;
  margin-top: .3rem;
  font-size: 11px;
}

.uc-threshold-popover__row {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-bottom: .4rem;
}

.uc-threshold-popover__input {
  width: 48px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 11px;
  padding: .15rem .3rem;
  text-align: right;
}

.uc-threshold-popover__actions { display: flex; gap: .3rem; }

/* ── Popover labels ── */
.uc-label-popover { max-height: 180px; overflow-y: auto; }

.uc-label-popover__row {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .15rem 0;
  cursor: pointer;
  font-size: 11px;
}

.uc-label-popover__row input[type="checkbox"] { cursor: pointer; flex-shrink: 0; }

/* ── Chart drill-down ── */
.uc-chart-panel {
  padding: .4rem .75rem .5rem 1.5rem;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.uc-chart-panel__header {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-bottom: .35rem;
  font-size: 11px;
  color: var(--muted);
}

.uc-chart-panel__back {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.uc-chart-panel svg { display: block; }

.uc-chart-panel__stats {
  font-size: 10px;
  color: var(--muted);
  margin-top: .25rem;
}

/* ── Onglet Historique ── */
#uc-view-history { display: none; }
#uc-view-history.uc-view--active { display: flex; flex-direction: column; flex: 1; overflow: hidden; }

.uc-history-list {
  overflow-y: auto;
  flex: 1;
  padding: .5rem 0;
}

.uc-history-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .4rem .75rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background .15s;
}

.uc-history-item:hover { background: var(--surface); }

.uc-history-item__info { flex: 1; min-width: 0; }
.uc-history-item__name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uc-history-item__domain { font-size: 10px; color: var(--muted); }
`;
