
const localStorageKey = window.localStorage.getItem('key');
const isInLoginOrLogoutPage = ['/entrar', '/sair'].includes(window.location.pathname);
const queryParameterKey = new URLSearchParams(window.location.search).get('key');
const key = localStorageKey || queryParameterKey;

if (queryParameterKey)
{
  if (!localStorageKey)
  {
    window.localStorage.setItem('key', queryParameterKey);
  }
  
  const url = new URL(window.location.toString());
  url.searchParams.delete('key');
  window.history.replaceState({}, document.title, url.toString());
}
else if (!key && !isInLoginOrLogoutPage)
{
  window.location.replace('/entrar');
}

async function validateBetaTesting() {
  if (key)
  {
    const response = await fetch(
      '/api/me',
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
  
    if (!guest.isBetaTester && !window.location.pathname.includes('manutencao'))
    {
      window.location.replace('/manutencao');
    }
  }
}

validateBetaTesting();
