export function initHeader() {
  const menuBtn = document.querySelector('.menu-toggle');
  menuBtn?.addEventListener('click', () => {
    document.querySelector('.nav-menu').classList.toggle('active');
  });
}