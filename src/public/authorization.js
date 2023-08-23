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
