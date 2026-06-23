(function () {
  // ── Page detection ─────────────────────────────────────────────────────────
  const _path = window.location.pathname;

  function _activePage() {
    if (_path.includes('/simulator/')) return 'simulator';
    if (_path.includes('/profile/'))   return 'profile';
    return 'bot'; // / and /bot/home.html both map to bot
  }

  // ── Auth state ─────────────────────────────────────────────────────────────
  function _isLoggedIn() {
    return typeof window.Auth !== 'undefined' && typeof window.Auth.isLoggedIn === 'function'
      ? window.Auth.isLoggedIn()
      : false;
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
    @media (max-width: 480px) {
      .navbar__brand { font-size: 1rem; }
      .navbar__link  { padding: 0.5rem 0.5rem; font-size: 0.875rem; }
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
      { id: 'bot',       label: 'Mortgage Bot', href: '/'                          },
      { id: 'simulator', label: 'Simulator',    href: '/simulator/simulator.html'  },
      {
        id:    'profile',
        label: loggedIn ? 'Profile' : 'Sign In',
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

    return `
      <nav class="navbar" aria-label="Main navigation">
        <div class="navbar__inner">
          <a class="navbar__brand" href="/">Guided Clarity</a>
          <ul class="navbar__links">
            ${items.join('\n')}
          </ul>
        </div>
      </nav>
    `;
  }

  // ── Mount ──────────────────────────────────────────────────────────────────
  function _mount() {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    root.innerHTML = _render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _mount);
  } else {
    _mount();
  }

  // Exposed so authClient.js can trigger a re-render after login/logout
  window.Navbar = { refresh: _mount };
})();
