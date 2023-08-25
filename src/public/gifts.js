const baseUrl = '/api';

const gifts = new Map();
let numberOfChosenGifts = 0;

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

  response.gifts.forEach((gift) => {
    const giftAndElements = { gift };
    gifts.set(gift.id, giftAndElements);
    listContainer.appendChild(createGiftElement(giftAndElements, response.userCanChooseMore));
  });
}

function createGiftElement(giftAndElements, userCanChooseMore) {
  const { id, description, photo_url, current, maximum, chosenByUser } = giftAndElements.gift;

  const element = document.createElement('li');
  element.className = 'gift-item';
  element.id = id;
  element.innerHTML = `
<section class="picture">
  <img src="${photo_url}" alt="Em breve teremos foto nesse retangulo">
</section>
<section class="description">
  <p>${description}</p>
</section>`;

  const chosenSection = document.createElement('section');
  chosenSection.className = 'amount';
  const paragraph = document.createElement('p');
  paragraph.innerHTML = `Escolhidos: <span><span class="current">${current}</span> / ${maximum}</span>`;
  
  const chosenNotice = document.createElement('span');
  chosenNotice.innerHTML = '<span> - Você já escolheu este presente</span>';
  chosenNotice.classList.add('hidden');
  if (chosenByUser === true) {
    chosenNotice.classList.remove('hidden');
  }
  paragraph.appendChild(chosenNotice);

  chosenSection.appendChild(paragraph);
  element.appendChild(chosenSection);

  const controlsSection = document.createElement('section');
  controlsSection.className = 'controls';

  const controlButton = document.createElement('button');

  if (chosenByUser === true) {
    controlButton.className = 'default-button';
    controlButton.dataset.giftId = id;
    controlButton.type = 'button';
    controlButton.innerHTML = 'Mudar de ideia';
    controlButton.addEventListener('click', unchooseGift);
  } else if (userCanChooseMore === false) {
    controlButton.className = 'already-chosen';
    controlButton.type = 'button';
    controlButton.innerHTML = 'Você já escolheu o máximo de presentes :)';
  } else if (current < maximum) {
    controlButton.className = 'default-button';
    controlButton.dataset.giftId = id;
    controlButton.type = 'button';
    controlButton.innerHTML = 'Escolher presente';
    controlButton.addEventListener('click', chooseGift);
  } else {
    controlButton.className = 'already-chosen';
    controlButton.type = 'button';
    controlButton.innerHTML = 'Este presente já foi escolhido';
  }

  controlsSection.appendChild(controlButton);

  element.appendChild(controlsSection);

  giftAndElements.controlButton = controlButton;
  giftAndElements.chosenParagraph = paragraph;
  giftAndElements.chosenNotice = chosenNotice;
  giftAndElements.atMaximum = current >= maximum;
  giftAndElements.canChoose = !chosenByUser && userCanChooseMore && !giftAndElements.atMaximum;
  giftAndElements.canUnchoose = chosenByUser;

  if (chosenByUser) {
    numberOfChosenGifts += 1;
  }

  return element;
}

async function chooseGift(event) {
  console.log(event);
  const id = event.target.dataset.giftId;
  const giftAndElements = gifts.get(id);
  const { gift, chosenNotice, controlButton, canChoose } = giftAndElements;

  if (!canChoose) {
    return;
  }

  gift.current += 1;
  const currentAmount = document.querySelector(`#${gift.id} .amount .current`);
  currentAmount.innerHTML = gift.current;

  controlButton.className = 'default-button';
  controlButton.dataset.giftId = id;
  controlButton.type = 'button';
  controlButton.innerHTML = 'Mudar de ideia';
  controlButton.addEventListener('click', unchooseGift);
  controlButton.removeEventListener('click', chooseGift);

  chosenNotice.classList.remove('hidden');
  numberOfChosenGifts += 1;
  giftAndElements.canChoose = false;

  if (numberOfChosenGifts >= 3) {
    gifts.forEach((g) => {
      if (g.canChoose) {
        g.canChoose = false;
        g.controlButton.className = 'already-chosen';
        g.controlButton.type = 'button';
        g.controlButton.innerHTML = 'Você já escolheu o máximo de presentes :)';
        g.controlButton.removeEventListener('click', chooseGift);
      }
    });
  }
  
  const response = await fetch(
    `${baseUrl}/gifts/choice/${id}`,
    { method: 'POST', headers: { Authorization: localStorage.getItem('key') } }
  ).then((res) => res.json());

  if (!response.ok) {
    if (response.error.code === 1) {
      alert('Este presente acabou de ser escolhido por outra pessoa! Recarregue a página');
    } else if (response.error.code === 401 || response.error.code === 403) {
      alert('Você está deslogado! Tente entrar novamente com sua chave');
      localStorage.removeItem('key');
      window.location.replace('/entrar');
    } else {
      alert('Opa, parece que alguma coisa deu errado :( - tente recarregar a página');
    }
    return;
  }
  
  giftAndElements.canUnchoose = true;
}

async function unchooseGift(event) {
  const id = event.target.dataset.giftId;
  const giftAndElements = gifts.get(id);
  const { gift, chosenNotice, controlButton, canUnchoose } = giftAndElements;
  console.log(giftAndElements);

  if (!canUnchoose) {
    return;
  }

  gift.current -= 1;
  const currentAmount = document.querySelector(`#${gift.id} .amount .current`);
  currentAmount.innerHTML = gift.current;

  controlButton.className = 'default-button';
  controlButton.dataset.giftId = id;
  controlButton.type = 'button';
  controlButton.innerHTML = 'Escolher presente';
  controlButton.addEventListener('click', chooseGift);
  controlButton.removeEventListener('click', unchooseGift);

  chosenNotice.classList.add('hidden');
  
  const response = await fetch(
    `${baseUrl}/gifts/choice/${id}`,
    { method: 'DELETE', headers: { Authorization: localStorage.getItem('key') } }
  ).then((res) => res.json());

  if (!response.ok) {
    if (response.error.code === 1) {
      alert('Este presente acabou de ser escolhido por outra pessoa! Recarregue a página');
    } else if (response.error.code === 401 || response.error.code === 403) {
      alert('Você está deslogado! Tente entrar novamente com sua chave');
      localStorage.removeItem('key');
      window.location.replace('/entrar');
    } else {
      alert('Opa, parece que alguma coisa deu errado :( - tente recarregar a página');
    }

    return;
  }

  giftAndElements.canUnchoose = false;
  giftAndElements.canChoose = true;

  gifts.forEach((g) => {
    if (!g.canChoose && !g.canUnchoose && !g.atMaximum) {
      g.canChoose = true;
      g.controlButton.className = 'default-button';
      g.controlButton.dataset.giftId = g.gift.id;
      g.controlButton.type = 'button';
      g.controlButton.innerHTML = 'Escolher presente';
      g.controlButton.addEventListener('click', chooseGift);
    }
  });
  numberOfChosenGifts -= 1;
}
