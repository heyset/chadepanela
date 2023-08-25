const baseUrl = '/api';
let confirmText;
let confirmExtraText;
let rsvpConfirmButton;
let rsvpDeclineButton;
let rsvpMainSection;

document.addEventListener('DOMContentLoaded', () => {
  populateElements();
  getRSVP()
    .then((rsvp) => {
      updateElementsText(rsvp);
      attachEventListeners(rsvp);
      rsvpMainSection.classList.remove('uninteractable');
    });
});

function populateElements() {
  confirmText = document.getElementById('confirm-text');
  confirmExtraText = document.getElementById('confirm-extra-text');
  rsvpConfirmButton = document.getElementById('rsvp-confirm');
  rsvpDeclineButton = document.getElementById('rsvp-decline');
  rsvpMainSection = document.getElementById('rsvp-main-section');
}

async function getRSVP() {
  const response = await fetch(
    `${baseUrl}/rsvp`,
    { method: 'GET', headers: { Authorization: localStorage.getItem('key') } }
  ).then((res) => res.json());

  if (!response.ok) {
      alert('Opa, parece que alguma coisa deu errado :( - tente recarregar a página');
      throw new Error('Error fetching rsvp');
  }

  const { rsvp } = response;
  return rsvp;
}

function removeEventListeners(rsvp) {
  if (rsvp.status === 'accepted') {
    rsvpConfirmButton.removeEventListener('click', rsvpConfirm); 
  }
  
  if (rsvp.status === 'declined') {
    rsvpDeclineButton.removeEventListener('click', rsvpDecline);
  }
}

function updateElementsText(rsvp) {
  const confirmTextDictionary = {
    pending: 'ainda não confirmou sua presença',
    declined: 'afirmou que não estará presente',
    accepted: 'confirmou sua presença',
  };
  confirmText.innerHTML = confirmTextDictionary[rsvp.status];
  
  const confirmExtraTextDictionary = {
    pending: 'Por gentileza, confirme se poderá estará presente até <strong>22/09/2023</strong> (uma semana antes)',
    declined: 'É uma pena, mas nós entendemos... Caso mude de ideia até <strong>22/09/2023</strong>, basta clicar no botão abaixo',
    accepted: 'Será um prazer receber você! Não se esqueça de entrar no grupo do WhatsApp.',
  };
  confirmExtraText.innerHTML = confirmExtraTextDictionary[rsvp.status];

  const rsvpConfirmButtonDictionary = {
    pending: 'Estarei presente!',
    declined: 'Estarei presente!',
    accepted: 'Você já confirmou a presença :)',
  };
  rsvpConfirmButton.innerHTML = rsvpConfirmButtonDictionary[rsvp.status];
  if (rsvp.status !== 'accepted') {
    rsvpConfirmButton.className = 'default-button';
  } else {
    rsvpConfirmButton.className = 'picked-option';
  }
  
  const rsvpDeclineButtonDictionary = {
    pending: 'Não poderei comparecer',
    declined: 'Você afirmou que não comparecerá',
    accepted: 'Não poderei comparecer',
  };
  rsvpDeclineButton.innerHTML = rsvpDeclineButtonDictionary[rsvp.status];
  if (rsvp.status !== 'declined') {
    rsvpDeclineButton.className = 'default-button';
  } else {
    rsvpDeclineButton.className = 'picked-option';
  }
}

function attachEventListeners(rsvp) {
  if (rsvp.status !== 'accepted') {
    rsvpConfirmButton.addEventListener('click', rsvpConfirm);
  }
  
  if (rsvp.status !== 'declined') {
    rsvpDeclineButton.addEventListener('click', rsvpDecline);
  }
}

async function rsvpConfirm() {
  const newRSVP = 'accepted';
  await updateRSVP({ status: newRSVP });
}

async function rsvpDecline() {
  const newRSVP = 'declined';
  await updateRSVP({ status: newRSVP })
}

async function updateRSVP(newRSVP) {
  removeEventListeners(newRSVP);
  updateElementsText(newRSVP);

  const response = await fetch(
    `${baseUrl}/rsvp`,
    {
      method: 'POST',
      headers: {
        Authorization: localStorage.getItem('key'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rsvp: newRSVP.status }),
    }
  ).then((res) => res.json());

  if (!response.ok) {
      alert('Opa, parece que alguma coisa deu errado :( - tente recarregar a página');
      throw new Error('Error fetching rsvp');
  }

  attachEventListeners(newRSVP);
}
