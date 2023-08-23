const baseUrl = '/api';

const gifts = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadList();
  } catch (err) {
    document.body.innerHTML = `<p>Alguma coisa deu errado :( - Manda print pro Matheus: ${err}</p>`
  }
});

async function loadList() {
  const listContainer = document.getElementById('gift-list-container');
  const response = await fetch(
    `${baseUrl}/gifts`,
    {
      headers: {
        Authorization: window.localStorage.getItem('key'),
      },
    }
  ).then((res) => res.json());

  if (!response.ok && (response.error.code === 401 || response.error.code === 403))
  {
    alert('Você está deslogado! Tente entrar novamente com sua chave');
    localStorage.removeItem('key');
    window.location.replace('/entrar');
    return;
  }

  response.gifts.forEach((gift) => gifts.set(gift.id, gift));
  response.gifts.forEach((gift) => {
    listContainer.appendChild(createGiftElement(gift));
  });
}

function createGiftElement(giftData) {
  const { id, description, photo_url, current, maximum } = giftData;

  const element = document.createElement('li');
  element.className = 'gift-item';
  element.id = id;
  element.innerHTML = `
<section class="picture">
  <img src="${photo_url}" alt="Em breve teremos foto nesse retangulo">
</section>
<section class="description">
  <p>${description}</p>
</section>
<section class="amount">
  <p>Escolhidos: <span><span class="current">${current}</span> / ${maximum}</span></p>
</section>`;

  const controlsSection = document.createElement('section');
  controlsSection.className = 'controls';

  let controlButton;

  if (current < maximum) {
    controlButton = document.createElement('button');
    controlButton.className = 'default-button';
    controlButton.dataset.giftId = id;
    controlButton.type = 'button';
    controlButton.innerHTML = 'Escolher presente';
    controlButton.addEventListener('click', chooseGift);
  } else {
    controlButton = document.createElement('button');
    controlButton.className = 'already-chosen';
    controlButton.type = 'button';
    controlButton.innerHTML = 'Este presente já foi escolhido';
  }

  controlsSection.appendChild(controlButton);

  element.appendChild(controlsSection);

  return element;
}

async function chooseGift(event) {
  const id = event.target.dataset.giftId;
  const gift = gifts.get(id);

  gift.current += 1;
  const currentAmount = document.querySelector(`#${gift.id} .amount .current`);
  currentAmount.innerHTML = gift.current;

  const controlButton = document.querySelector(`#${gift.id} .controls button.default-button`);
  if (gift.current >= gift.maximum)
  {
    controlButton.className = 'already-chosen';
    controlButton.innerHTML = 'Este presente já foi escolhido';
    controlButton.removeEventListener('click', chooseGift);
  }
  
  const response = await fetch(
    `${baseUrl}/gifts/choose/${id}`,
    { method: 'POST', headers: { Authorization: localStorage.getItem('key') } }
  ).then((res) => res.json())
  if (!response.ok) {
    if (response.error.code === 1) {
      alert('Este presente acabou de ser escolhido por outra pessoa! Recarregue a página');
    }
    if (response.error.code === 401 || response.error.code === 403)
    {
      alert('Você está deslogado! Tente entrar novamente com sua chave');
      localStorage.removeItem('key');
      window.location.replace('/entrar');
    }
  }
}
