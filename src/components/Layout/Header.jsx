import { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { DownloadContext } from '../../App';

function pathMatches(current, path) {
  if (path === '/') return current === '/';
  return current === path || current.startsWith(`${path}/`);
}

export default function Header({ sections = [] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const download = useContext(DownloadContext);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = useCallback(
    (path) => {
      navigate(path);
      setMobileOpen(false);
    },
    [navigate]
  );

  return (
    <>
      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <a href="https://rulebase.co" className="header-logo" target="_blank" rel="noopener noreferrer">
          <img src="/rulebase-logo.svg" alt="Rulebase" style={{ height: 24 }} />
        </a>

        <nav className="pill-nav">
          {sections.map((s) => (
            <NavLink
              key={s.path}
              to={s.path}
              end={s.path === '/'}
              className={({ isActive }) => `pill-nav-item${isActive ? ' active' : ''}`}
            >
              {s.label}
            </NavLink>
          ))}
          <button
            type="button"
            className="pill-nav-item pill-nav-download"
            onClick={() => download?.trigger()}
          >
            Download
          </button>
        </nav>

        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </header>

      <nav className={`mobile-nav-menu${mobileOpen ? ' open' : ''}`}>
        {sections.map((s) => (
          <button
            key={s.path}
            type="button"
            className={`mobile-nav-link${pathMatches(location.pathname, s.path) ? ' active' : ''}`}
            onClick={() => go(s.path)}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          className="mobile-nav-link mobile-nav-download"
          onClick={() => { setMobileOpen(false); download?.trigger(); }}
        >
          Download PDF
        </button>
      </nav>
    </>
  );
}
