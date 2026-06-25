(function () {
  // ── Page detection ─────────────────────────────────────────────────────────
  const _path = window.location.pathname;

  function _activePage() {
    if (_path.includes('/simulator/')) return 'simulator';
    if (_path.includes('/profile/'))   return 'profile';
    if (_path.includes('/admin/'))     return 'admin';
    return 'bot'; // / and /bot/home.html both map to bot
  }

  // ── Auth state ─────────────────────────────────────────────────────────────
  function _isLoggedIn() {
    return typeof window.Auth !== 'undefined' && typeof window.Auth.isLoggedIn === 'function'
      ? window.Auth.isLoggedIn()
      : false;
  }

  // ── i18n helper — safe even if i18n.js not loaded ─────────────────────────
  function _t(key, fallback) {
    return (window.I18n ? window.I18n.t(key) : null) || fallback;
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const _css = `
    .navbar {
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar__inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
    }
    .navbar__brand {
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 700;
      font-size: 1.125rem;
      color: #4d7c7a;
      text-decoration: none;
    }
    .navbar__links {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .navbar__link {
      font-family: 'Nunito Sans', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #404948;
      text-decoration: none;
      padding: 0.5rem 0.875rem;
      border-radius: 9999px;
      transition: background-color 0.2s, color 0.2s;
    }
    .navbar__link:hover {
      background-color: #cfe9e7;
      color: #4d7c7a;
    }
    .navbar__link--active {
      background-color: #cfe9e7;
      color: #4d7c7a;
    }
    .navbar__lang-btn {
      font-family: 'Nunito Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      color: #4d7c7a;
      background: none;
      border: 1.5px solid #4d7c7a;
      border-radius: 9999px;
      padding: 0.3rem 0.75rem;
      cursor: pointer;
      margin-inline-start: 0.5rem;
      transition: background-color 0.2s, color 0.2s;
      white-space: nowrap;
    }
    .navbar__lang-btn:hover {
      background-color: #4d7c7a;
      color: #ffffff;
    }
    .navbar__logout-btn {
      font-family: 'Nunito Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      background: none;
      border: 1.5px solid #d1d5db;
      border-radius: 9999px;
      padding: 0.3rem 0.75rem;
      cursor: pointer;
      margin-inline-start: 0.25rem;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
      white-space: nowrap;
    }
    .navbar__logout-btn:hover {
      background-color: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }
    @media (max-width: 480px) {
      .navbar__brand { font-size: 1rem; }
      .navbar__link  { padding: 0.5rem 0.5rem; font-size: 0.875rem; }
      .navbar__lang-btn { padding: 0.3rem 0.5rem; font-size: 0.8rem; }
      .navbar__logout-btn { padding: 0.3rem 0.5rem; font-size: 0.8rem; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = _css;
  document.head.appendChild(styleEl);

  // ── Render ─────────────────────────────────────────────────────────────────
  function _render() {
    const active   = _activePage();
    const loggedIn = _isLoggedIn();

    const links = [
      { id: 'simulator', label: _t('nav.simulator', 'Simulator'), href: '/simulator/simulator.html' },
      {
        id:    'profile',
        label: loggedIn ? _t('nav.profile', 'Profile') : _t('nav.signIn', 'Sign In'),
        href:  loggedIn ? '/profile/profile.html' : '/auth/login.html',
      },
    ];

    const items = links.map(({ id, label, href }) => {
      const isActive = id === active;
      return `<li>
        <a class="navbar__link${isActive ? ' navbar__link--active' : ''}"
           href="${href}"
           aria-current="${isActive ? 'page' : 'false'}"
        >${label}</a>
      </li>`;
    });

    const langLabel    = _t('nav.langBtn', 'עברית');
    const logoutLabel  = _t('nav.logout', 'Log out');
    const logoutBtn    = loggedIn
      ? `<button class="navbar__logout-btn" id="logout-btn" aria-label="Log out">${logoutLabel}</button>`
      : '';

    // Links come first in the DOM so that flex row-start matches reading direction:
    // LTR → links sit at the LEFT; RTL (html[dir=rtl] reverses flex row) → links sit at the RIGHT.
    return `
      <nav class="navbar" aria-label="Main navigation">
        <div class="navbar__inner">
          <div style="display:flex;align-items:center;gap:0.25rem;">
            <ul class="navbar__links">
              ${items.join('\n')}
            </ul>
            <button class="navbar__lang-btn" id="lang-toggle-btn" aria-label="Toggle language">${langLabel}</button>
            ${logoutBtn}
          </div>
          <a class="navbar__brand" href="/">Guided Clarity</a>
        </div>
      </nav>
    `;
  }

  // ── Mount ──────────────────────────────────────────────────────────────────
  function _mount() {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    root.innerHTML = _render();

    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        if (window.I18n) window.I18n.toggle();
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => window.Auth.logout());
    }

    // Async: inject Admin link only for the admin user
    if (_isLoggedIn() && window.Auth) {
      fetch('/api/auth/me', { headers: window.Auth.getAuthHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.isAdmin) return;
          const ul = root.querySelector('.navbar__links');
          if (!ul) return;
          const active = _activePage();
          const li = document.createElement('li');
          li.innerHTML = `<a class="navbar__link${active === 'admin' ? ' navbar__link--active' : ''}" href="/admin/admin.html" aria-current="${active === 'admin' ? 'page' : 'false'}">Admin</a>`;
          ul.appendChild(li);
        })
        .catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _mount);
  } else {
    _mount();
  }

  // Exposed so authClient.js can trigger a re-render after login/logout
  window.Navbar = { refresh: _mount };
})();
