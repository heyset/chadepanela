const baseUrl = '/api';

async function fetchPersonName()
{

  const response = await fetch(
    `${baseUrl}/guest-name`,
    {
      headers: {
        Authorization: window.localStorage.getItem('key'),
      },
    }
  ).then((res) => res.json());

  if (!response.ok && (response.error.code === 401 || response.error.code === 403)) {
    alert('Você está deslogado! Tente entrar novamente com sua chave');
    localStorage.removeItem('key');
    window.location.replace('/entrar');
    return;
  }
  const guest = response.guest;

  const guestName = document.getElementById('guest-name');
  guestName.innerHTML = guest.name;

  console.log(response.guest);

  if (guest.specialMessage) {
    const specialMessage = document.getElementById('special-message');
    specialMessage.innerHTML = guest.specialMessage;
    specialMessage.classList.remove('hidden');
  }

  const mainSection = document.getElementById('home-main-section');
  mainSection.classList.remove('hidden');
}

fetchPersonName();
