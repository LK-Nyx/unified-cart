UC_TEST.it('ui-styles: UC_UI_STYLES est une string non vide', () => {
  UC_TEST.assert(typeof UC_UI_STYLES === 'string' && UC_UI_STYLES.length > 0);
});

UC_TEST.it('ui-styles: contient les variables Catppuccin', () => {
  UC_TEST.assert(UC_UI_STYLES.includes('--bg'));
  UC_TEST.assert(UC_UI_STYLES.includes('--accent'));
  UC_TEST.assert(UC_UI_STYLES.includes('#1e1e2e'));
});

UC_TEST.it('ui-styles: contient le sélecteur #uc-sidebar', () => {
  UC_TEST.assert(UC_UI_STYLES.includes('#uc-sidebar'));
});

UC_TEST.it('ui-styles: contient les styles du bouton flottant #uc-fab', () => {
  UC_TEST.assert(UC_UI_STYLES.includes('#uc-fab'));
});
