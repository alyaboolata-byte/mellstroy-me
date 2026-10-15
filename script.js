const languageButton = document.querySelector('[data-lang-button]');
const languageList = document.querySelector('#lang-list');
const menuButton = document.querySelector('[data-menu-button]');
const mobileMenu = document.querySelector('#mobile-menu');
languageButton?.addEventListener('click', () => {
  const open = languageList.hidden;
  languageList.hidden = !open;
  languageButton.setAttribute('aria-expanded', String(open));
});
menuButton?.addEventListener('click', () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  if (!event.target.closest('.lang-control')) {
    languageList.hidden = true;
    languageButton.setAttribute('aria-expanded', 'false');
  }
  if (event.target.closest('.mobile-menu a')) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }
});
