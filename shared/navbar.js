(function () {
  // ── Root URL derivation ────────────────────────────────────────────────────
  // Find this script tag to compute an absolute root — works regardless of
  // which page loads the navbar (client/*/ or shared/).
  const _script = document.querySelector('script[src*="navbar"]');
  const _root   = _script ? _script.src.replace(/shared\/navbar\.js$/, '') : '';

  // ── Page detection ─────────────────────────────────────────────────────────
  const _path = window.location.pathname;

  function _activePage() {
    if (_path.includes('/simulator/')) return 'simulator';
    if (_path.includes('/profile/'))   return 'profile';
    return 'bot'; // home.html + index.html + anything else defaults to bot
  }

  // ── Auth state ─────────────────────────────────────────────────────────────
  // auth.js exposes window.Auth; fall back to guest if not yet loaded.
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
    .navbar__link--locked {
      color: #707978;
      cursor: pointer;
    }
    .navbar__link--locked::after {
      content: ' 🔒';
      font-size: 0.75rem;
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
    const active    = _activePage();
    const loggedIn  = _isLoggedIn();

    const links = [
      { id: 'bot',       label: 'Mortgage Bot', href: `${_root}client/bot/home.html`             },
      { id: 'simulator', label: 'Simulator',    href: `${_root}client/simulator/simulator.html`  },
      { id: 'profile',   label: 'Profile',      href: `${_root}client/profile/profile.html`      },
    ];

    const items = links.map(({ id, label, href }) => {
      const isActive = id === active;
      const isProfile = id === 'profile';

      if (isProfile && !loggedIn) {
        // Guest — render as a button-like link that alerts rather than navigating
        return `<li>
          <a class="navbar__link navbar__link--locked"
             href="#"
             onclick="event.preventDefault(); alert('Please log in to access your profile.');"
             aria-label="${label} — login required"
          >${label}</a>
        </li>`;
      }

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
          <a class="navbar__brand" href="${_root}client/bot/home.html">Guided Clarity</a>
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

  // Mount immediately if DOM is ready; otherwise wait for it
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _mount);
  } else {
    _mount();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  // Exposed so auth.js can trigger a re-render after login/logout
  window.Navbar = { refresh: _mount };
})();
