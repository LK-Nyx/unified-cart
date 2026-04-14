// Test runner minimaliste — zéro dépendance, tourne dans Firefox
const UC_TEST = (() => {
  const _queue = [];
  let _passed = 0, _failed = 0;

  const it = (name, fn) => _queue.push({ name, fn });

  const assert = (condition, msg) => {
    if (!condition) throw new Error(msg ?? 'Assertion échouée');
  };

  const assertEqual = (a, b, msg) => {
    if (a !== b) throw new Error(msg ?? `Attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
  };

  const assertDeepEqual = (a, b, msg) => {
    const as = JSON.stringify(a), bs = JSON.stringify(b);
    if (as !== bs) throw new Error(msg ?? `Attendu ${bs}, obtenu ${as}`);
  };

  const assertThrows = async (fn, msg) => {
    let threw = false;
    try { await fn(); } catch { threw = true; }
    if (!threw) throw new Error(msg ?? 'Attendu une erreur, aucune levée');
  };

  const run = async () => {
    const results = document.getElementById('uc-results');
    const summary = document.getElementById('uc-summary');
    if (results) results.innerHTML = '';

    for (const { name, fn } of _queue) {
      const row = document.createElement('div');
      try {
        await fn();
        _passed++;
        row.className = 'pass';
        row.textContent = `✓ ${name}`;
        console.log(`[UC:test] ✓ ${name}`);
      } catch (e) {
        _failed++;
        row.className = 'fail';
        row.textContent = `✗ ${name} — ${e.message}`;
        console.error(`[UC:test] ✗ ${name}`, e);
      }
      if (results) results.appendChild(row);
    }

    const msg = `${_passed} passés, ${_failed} échoués sur ${_queue.length} tests`;
    if (summary) summary.textContent = msg;
    console.log(`[UC:test] ${msg}`);
  };

  return { it, assert, assertEqual, assertDeepEqual, assertThrows, run };
})();
