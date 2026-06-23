(function () {
  const TOKEN_KEY = 'gc_auth_token';

  function _decode(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b64));
    } catch {
      return null;
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    const payload = _decode(token);
    if (!payload) return false;
    if (payload.exp && Date.now() > payload.exp) {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
    return true;
  }

  function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    if (window.Navbar) window.Navbar.refresh();
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/';
  }

  function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  window.Auth = { isLoggedIn, saveToken, logout, getToken, getAuthHeaders };
})();
