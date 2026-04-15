UC_TEST.it('utils: esc() échappe <script>', () => {
  UC_TEST.assertEqual(UCUtils.esc('<script>'), '&lt;script&gt;');
});

UC_TEST.it('utils: esc() échappe les guillemets', () => {
  UC_TEST.assertEqual(UCUtils.esc('"hello"'), '&quot;hello&quot;');
});

UC_TEST.it('utils: esc() retourne "" pour null/undefined', () => {
  UC_TEST.assertEqual(UCUtils.esc(null), '');
  UC_TEST.assertEqual(UCUtils.esc(undefined), '');
});

UC_TEST.it('utils: esc() échappe &', () => {
  UC_TEST.assertEqual(UCUtils.esc('a & b'), 'a &amp; b');
});
