UC_TEST.it('ui-toast: show() crée un élément toast dans le shadow root', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const sidebar = document.createElement('div');
  sidebar.id = 'uc-sidebar';
  shadow.appendChild(sidebar);

  UCUIToast.show(shadow, 'Test message', 'info', 10000);

  const toast = shadow.querySelector('.uc-toast');
  UC_TEST.assert(!!toast, 'Toast non trouvé dans le shadow root');
  UC_TEST.assert(toast.textContent === 'Test message');
  UC_TEST.assert(toast.classList.contains('uc-toast--info'));

  host.remove();
});

UC_TEST.it('ui-toast: show() avec type error a la bonne classe', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const sidebar = document.createElement('div');
  sidebar.id = 'uc-sidebar';
  shadow.appendChild(sidebar);

  UCUIToast.show(shadow, 'Erreur test', 'error', 10000);

  const toast = shadow.querySelector('.uc-toast--error');
  UC_TEST.assert(!!toast, 'Toast error non trouvé');

  host.remove();
});
