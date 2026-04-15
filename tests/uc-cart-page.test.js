const setLocation = (pathname, title = 'Test Page', href = null) => {
  UCCartPageDetector._testOverride({
    href: href ?? `https://example.com${pathname}`,
    pathname,
    title,
  });
};

UC_TEST.it('cart-page: /cart détecté par URL', () => {
  setLocation('/cart');
  UC_TEST.assert(UCCartPageDetector.isCartPage());
});

UC_TEST.it('cart-page: /panier détecté par URL', () => {
  setLocation('/panier');
  UC_TEST.assert(UCCartPageDetector.isCartPage());
});

UC_TEST.it('cart-page: /checkout détecté par URL', () => {
  setLocation('/checkout/step1');
  UC_TEST.assert(UCCartPageDetector.isCartPage());
});

UC_TEST.it('cart-page: titre "Mon panier" détecté', () => {
  setLocation('/products/shoes', 'Mon Panier (3 articles)');
  UC_TEST.assert(UCCartPageDetector.isCartPage());
});

UC_TEST.it('cart-page: page produit lambda non détectée', () => {
  setLocation('/products/shoes', 'Sneakers Nike Air Max');
  UC_TEST.assert(!UCCartPageDetector.isCartPage());
});

UC_TEST.it('cart-page: about:blank ignoré', () => {
  UCCartPageDetector._testOverride({ href: 'about:blank', pathname: '', title: '' });
  UC_TEST.assert(!UCCartPageDetector.isCartPage());
});

UC_TEST.it('cart-page: moz-extension:// ignoré', () => {
  UCCartPageDetector._testOverride({ href: 'moz-extension://abc/popup.html', pathname: '/popup.html', title: '' });
  UC_TEST.assert(!UCCartPageDetector.isCartPage());
});
