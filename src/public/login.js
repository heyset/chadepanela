const baseUrl = '/api';


document.addEventListener('DOMContentLoaded', () => {
  assignSubmitEventListener();
});

function assignSubmitEventListener() {
  const form = document.getElementById('form');
  const keyElement = document.getElementById('key');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const key =  keyElement.value;
  
    fetch(
      `${baseUrl}/login`,
      {
        method: 'POST',
        headers: {
          Authorization: key,
        },
      }
    )
      .then((res) => res.json())
      .then((response) => {
        if (!response.ok && (response.error.code === 401 || response.error.code === 403))
        {
          alert('Não foi possível logar! Verifique sua chave e tente novamente');
          window.location.replace('/entrar');
          return;
        }
  
        localStorage.setItem('key', key);
        window.location.href = '/';
      });
  });
}
