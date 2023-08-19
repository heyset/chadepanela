const baseUrl = 'http://localhost:3000';

const gifts = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  console.log("load");
  try {
    const listContainer = document.getElementById('gift-list-container');
    const result = await fetch(`${baseUrl}/gifts`).then((res) => res.json());
    result.gifts.forEach((gift) => gifts.set(gift.id, gift));
    result.gifts.forEach((gift) => {
      listContainer.appendChild(createGiftElement(gift));
    });
  } catch (err) {
    document.body.innerHTML = `<p>Alguma coisa deu errado :( - Manda print pro Matheus: ${err}</p>`
  }
});

function createGiftElement(giftData) {
  const { id, description, photo, current, maximum } = giftData;

  const element = document.createElement('li');
  element.className = 'gift-item';
  element.id = id;
  element.innerHTML = `
<section class="picture">
  <img src="${photo}" alt="Em breve teremos foto nesse retangulo">
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
    controlButton.className = 'choose';
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

  if (gift.current >= gift.maximum)
  {
    const controlButton = document.querySelector(`#${gift.id} .controls button.choose`);
    controlButton.className = 'already-chosen';
    controlButton.innerHTML = 'Este presente já foi escolhido';
    controlButton.removeEventListener('click', chooseGift);
  }

  await fetch(`${baseUrl}/gifts/choose/${id}`, { method: 'POST' });
}
