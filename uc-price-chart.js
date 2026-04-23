// @module uc-price-chart.js
// [UC:price-chart] Graphiques SVG natifs à partir de priceHistory[].
// Dépend de : aucun

const UCPriceChart = (() => {
  const _NS = 'http://www.w3.org/2000/svg';

  const _svg = (w, h) => {
    const el = document.createElementNS(_NS, 'svg');
    el.setAttribute('width', String(w));
    el.setAttribute('height', String(h));
    el.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return el;
  };

  const _el = (tag, attrs) => {
    const el = document.createElementNS(_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  };

  const _text = (x, y, content, anchor = 'end', size = 9, fill = '#6c7086') => {
    const el = _el('text', { x, y, 'text-anchor': anchor, fill, 'font-size': size });
    el.textContent = content;
    return el;
  };

  const renderMini = (item) => {
    const W = 80, H = 30;
    const svg = _svg(W, H);
    const history = item.priceHistory ?? [];

    if (history.length < 2) {
      svg.appendChild(_text(W / 2, H / 2 + 4, '—', 'middle', 9));
      return svg;
    }

    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const range = Math.max(...prices) - min || 1;
    const pad = 3;

    const pts = history.map((entry, i) => {
      const x = (pad + (i / (history.length - 1)) * (W - pad * 2)).toFixed(1);
      const y = (pad + (1 - (entry.price - min) / range) * (H - pad * 2)).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    svg.appendChild(_el('polyline', { points: pts, fill: 'none', stroke: '#89b4fa', 'stroke-width': '1.5' }));
    return svg;
  };

  const renderFull = (item) => {
    const W = 240, H = 100;
    const PL = 40, PR = 8, PT = 10, PB = 24;
    const svg = _svg(W, H);
    const history = item.priceHistory ?? [];
    const currency = item.currency ?? '€';

    if (history.length < 2) {
      svg.appendChild(_text(W / 2, H / 2, 'Pas assez de données', 'middle', 11));
      return svg;
    }

    const prices = history.map(h => h.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const IW = W - PL - PR;
    const IH = H - PT - PB;
    const n = history.length;

    const tx = (i) => (PL + (i / Math.max(n - 1, 1)) * IW).toFixed(1);
    const ty = (p) => (PT + (1 - (p - minP) / range) * IH).toFixed(1);
    const axisColor = '#45475a';

    svg.appendChild(_el('line', { x1: PL, y1: PT, x2: PL, y2: PT + IH, stroke: axisColor, 'stroke-width': 1 }));
    svg.appendChild(_el('line', { x1: PL, y1: PT + IH, x2: PL + IW, y2: PT + IH, stroke: axisColor, 'stroke-width': 1 }));

    svg.appendChild(_text(PL - 3, PT + 4, `${currency}${maxP.toFixed(0)}`));
    svg.appendChild(_text(PL - 3, PT + IH, `${currency}${minP.toFixed(0)}`));

    const fmt = (ts) => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    svg.appendChild(_text(PL, PT + IH + 14, fmt(history[0].seenAt), 'start'));
    svg.appendChild(_text(PL + IW, PT + IH + 14, fmt(history[n - 1].seenAt), 'end'));

    const pts = history.map((entry, i) => `${tx(i)},${ty(entry.price)}`).join(' ');
    svg.appendChild(_el('polyline', { points: pts, fill: 'none', stroke: '#89b4fa', 'stroke-width': '1.5' }));

    for (let i = 0; i < n; i++) {
      svg.appendChild(_el('circle', { cx: tx(i), cy: ty(history[i].price), r: 2.5, fill: '#89b4fa' }));
    }

    return svg;
  };

  return { renderMini, renderFull };
})();
