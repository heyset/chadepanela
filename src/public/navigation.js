document.addEventListener('DOMContentLoaded', async () => {
  try {
    attachNavigationEventListeners();
  } catch (err) {
    document.body.innerHTML = `<p>Alguma coisa deu errado :( - Manda print pro Matheus: ${err}</p>`
  }
});

function attachNavigationEventListeners() {
  const navigationButton = document.getElementById('navigation-menu-button');
  const navigationMenu = document.getElementById('navigation-menu');
  const navigationMenuOverlays = document.querySelectorAll('.navigation-menu-overlay');

  navigationButton.addEventListener('click', () => {
    toggleMenuOpen(navigationButton, navigationMenu, navigationMenuOverlays);
  });

  navigationMenuOverlays.forEach((overlayElement) => {
    overlayElement.addEventListener('click', () => {
      toggleMenuOpen(navigationButton, navigationMenu, navigationMenuOverlays);
    });
  });
}

function toggleMenuOpen(navigationButton, navigationMenu, navigationMenuOverlays) {
  navigationMenu.classList.toggle('open');
  navigationButton.classList.toggle('open');
  navigationMenuOverlays.forEach((overlayElement) => {
    overlayElement.classList.toggle('shown');
  });
}
