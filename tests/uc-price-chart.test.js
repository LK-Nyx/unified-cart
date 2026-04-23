// tests/uc-price-chart.test.js

const _chartItem = (history) => ({
  id: 'c1', name: 'GPU Test', price: history[history.length - 1]?.price ?? 100,
  currency: '€', labels: [], priceHistory: history,
});

UC_TEST.it('price-chart: renderMini() retourne un SVGSVGElement', () => {
  const item = _chartItem([{ price: 30, seenAt: 1 }, { price: 25, seenAt: 2 }]);
  const svg = UCPriceChart.renderMini(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, `Attendu SVGSVGElement, obtenu ${svg?.constructor?.name}`);
});

UC_TEST.it('price-chart: renderMini() avec < 2 points retourne quand même un SVG', () => {
  const item = _chartItem([{ price: 30, seenAt: 1 }]);
  const svg = UCPriceChart.renderMini(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, 'SVG attendu même avec 1 point');
});

UC_TEST.it('price-chart: renderMini() dimensions 80×30', () => {
  const item = _chartItem([{ price: 30, seenAt: 1 }, { price: 25, seenAt: 2 }]);
  const svg = UCPriceChart.renderMini(item);
  UC_TEST.assertEqual(svg.getAttribute('width'), '80');
  UC_TEST.assertEqual(svg.getAttribute('height'), '30');
});

UC_TEST.it('price-chart: renderFull() retourne un SVGSVGElement', () => {
  const item = _chartItem([
    { price: 100, seenAt: 1000 },
    { price: 90, seenAt: 2000 },
    { price: 95, seenAt: 3000 },
  ]);
  const svg = UCPriceChart.renderFull(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, `Attendu SVGSVGElement, obtenu ${svg?.constructor?.name}`);
});

UC_TEST.it('price-chart: renderFull() contient une polyline', () => {
  const item = _chartItem([{ price: 100, seenAt: 1 }, { price: 80, seenAt: 2 }]);
  const svg = UCPriceChart.renderFull(item);
  const polyline = svg.querySelector('polyline');
  UC_TEST.assert(polyline !== null, 'Polyline absente du SVG');
});

UC_TEST.it('price-chart: renderFull() avec < 2 points retourne SVG avec message', () => {
  const item = _chartItem([{ price: 100, seenAt: 1 }]);
  const svg = UCPriceChart.renderFull(item);
  UC_TEST.assert(svg instanceof SVGSVGElement, 'SVG attendu');
  const text = svg.querySelector('text');
  UC_TEST.assert(text !== null, 'Texte de fallback attendu');
});

UC_TEST.it('price-chart: renderFull() dimensions 240×100', () => {
  const item = _chartItem([{ price: 100, seenAt: 1 }, { price: 80, seenAt: 2 }]);
  const svg = UCPriceChart.renderFull(item);
  UC_TEST.assertEqual(svg.getAttribute('width'), '240');
  UC_TEST.assertEqual(svg.getAttribute('height'), '100');
});
