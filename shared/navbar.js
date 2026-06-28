(function () {
  // ── Page detection ─────────────────────────────────────────────────────────
  const _path = window.location.pathname;

  function _activePage() {
    if (_path.includes('/simulator/')) return 'simulator';
    if (_path.includes('/profile/'))   return 'profile';
    if (_path.includes('/admin/'))     return 'admin';
    if (_path.includes('/bot/'))       return 'bot';
    return 'home';
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
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar__inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
    }
    .navbar__brand {
      font-family: 'IBM Plex Sans', sans-serif;
      font-weight: 700;
      font-size: 1.125rem;
      color: #161616;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .navbar__brand-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .navbar__brand-name { direction: ltr; }
    .navbar__brand-blue { color: #0f62fe; font-weight: 600; }
    .navbar__brand-step { color: #161616; font-weight: 800; }
    .navbar__links {
      display: flex;
      align-items: center;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .navbar__link {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      color: #525252;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 0;
      transition: background-color 0.15s, color 0.15s;
      display: block;
      height: 56px;
      line-height: 56px;
      padding: 0 1rem;
      border-bottom: 2px solid transparent;
      box-sizing: border-box;
    }
    .navbar__link:hover {
      background-color: #f4f4f4;
      color: #161616;
    }
    .navbar__link--active {
      color: #0f62fe;
      border-bottom-color: #0f62fe;
      font-weight: 600;
    }
    .navbar__lang-btn {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f62fe;
      background: none;
      border: 1px solid #0f62fe;
      border-radius: 2px;
      padding: 0.375rem 0.875rem;
      cursor: pointer;
      margin-inline-start: 1rem;
      transition: background-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .navbar__lang-btn:hover {
      background-color: #0f62fe;
      color: #ffffff;
    }
    .navbar__logout-btn {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #525252;
      background: none;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
      padding: 0.375rem 0.875rem;
      cursor: pointer;
      margin-inline-start: 0.5rem;
      transition: background-color 0.15s, color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .navbar__logout-btn:hover {
      background-color: #fff1f1;
      color: #da1e28;
      border-color: #da1e28;
    }
    @media (max-width: 600px) {
      .navbar__inner { padding: 0 1rem; }
      .navbar__brand-light { display: none; }
      .navbar__link { padding: 0 0.625rem; font-size: 0.8125rem; }
      .navbar__lang-btn { padding: 0.3rem 0.5rem; }
      .navbar__logout-btn { padding: 0.3rem 0.5rem; }
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
      { id: 'bot',       label: _t('nav.bot',       'Bot'),       href: '/bot/home.html' },
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

    return `
      <nav class="navbar" aria-label="Main navigation">
        <div class="navbar__inner">
          <a class="navbar__brand" href="/">
            <div class="navbar__brand-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 17 L16 5 L30 17" stroke="#0f62fe" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
                <path d="M6 17 L6 27 L26 27 L26 17" stroke="#0f62fe" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
                <rect x="9" y="20" width="3.5" height="7" fill="#0f62fe"/>
                <rect x="14" y="17" width="3.5" height="10" fill="#0353e9"/>
                <rect x="19" y="14" width="3.5" height="13" fill="#0043ce"/>
                <path d="M8 25 C12 20 17 14 24 10" stroke="#93c6ff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M24 10 L21 11.5 M24 10 L24 13.5" stroke="#93c6ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="navbar__brand-name"><span class="navbar__brand-blue">Door</span><span class="navbar__brand-step">Step</span></span>
          </a>
          <div style="display:flex;align-items:center;">
            <ul class="navbar__links">
              ${items.join('\n')}
            </ul>
            <button class="navbar__lang-btn" id="lang-toggle-btn" aria-label="Toggle language">${langLabel}</button>
            ${logoutBtn}
          </div>
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
