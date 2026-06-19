import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SiteConfig } from '../../content/siteContent';

interface NavbarProps {
  content: SiteConfig;
  onNavigate?: (section: string) => void;
}

const Navbar = ({ content, onNavigate }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);

  const navItems = [
    { label: content.header.navHome, section: 'home' },
    { label: content.header.navProfessionals, section: 'professionals' },
    { label: content.header.navServices, section: 'services' },
    { label: content.header.navBooking, section: 'booking' },
  ];

  const internalLinks = [
    { label: 'Painel Administrativo', to: '/admin' },
    { label: 'Agenda', to: '/agenda' },
    { label: 'Notificações', to: '/notificacoes' },
    { label: 'Pacotes', to: '/pacotes-ativos' },
  ];

  const isInternalPage =
    location.pathname === '/admin' ||
    location.pathname === '/agenda' ||
    location.pathname === '/pacotes-ativos' ||
    location.pathname === '/notificacoes' ||
    location.pathname === '/modelo-config';

  const handleNavClick = (section: string) => {
    setMenuOpen(false);
    setInternalMenuOpen(false);

    if (location.pathname === '/') {
      onNavigate?.(section);
      return;
    }

    navigate('/', { state: { scrollTo: section } });
  };

  const handleInternalLinkClick = () => {
    setMenuOpen(false);
    setInternalMenuOpen(false);
  };

  if (isInternalPage) return null;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gold-400/20 bg-dark-800/90 shadow-dark-lg backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            onClick={() => {
              setMenuOpen(false);
              setInternalMenuOpen(false);
            }}
            className="w-[11rem] shrink-0 font-serif text-base font-bold leading-tight text-gold-400 transition-colors duration-300 hover:text-gold-300 sm:w-auto sm:text-3xl"
          >
            <span className="block break-words sm:hidden">{content.siteName}</span>
            <span className="hidden sm:inline">{content.siteName}</span>
          </Link>

          <div className="hidden items-center gap-5 lg:flex xl:gap-8">
            {navItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => handleNavClick(item.section)}
                className="text-sm font-medium uppercase tracking-wide text-gray-300 transition-colors duration-200 hover:text-gold-400"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setInternalMenuOpen((current) => !current)}
                aria-expanded={internalMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-full border border-gold-400/35 px-4 py-2 text-sm font-semibold text-gold-300 transition hover:border-gold-400 hover:bg-gold-400/10 hover:text-gold-200"
              >
                Painel Demo
                <svg
                  className={`h-4 w-4 transition-transform ${internalMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {internalMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-gold-400/20 bg-dark-800/95 py-2 shadow-dark-lg backdrop-blur"
                >
                  {internalLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleInternalLinkClick}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gold-400/10 hover:text-gold-300"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleNavClick('booking')}
              className="rounded-full bg-gold-400 px-6 py-2 text-sm font-semibold text-dark-900 transition-all duration-300 hover:bg-gold-300 hover:shadow-gold-glow"
            >
              {content.buttons.scheduleNow}
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((current) => !current);
                setInternalMenuOpen(false);
              }}
              aria-label={
                menuOpen
                  ? content.header.closeMenuAria
                  : content.header.openMenuAria
              }
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gold-400 transition hover:bg-dark-700"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-gold-400/20 bg-dark-700/50 py-3 backdrop-blur lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => handleNavClick(item.section)}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-400"
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleNavClick('booking')}
                className="mt-2 rounded-full bg-gold-400 px-4 py-3 text-sm font-semibold text-dark-900 transition-all hover:bg-gold-300 hover:shadow-gold-glow"
              >
                {content.buttons.scheduleNow}
              </button>

              <div className="mt-2 rounded-2xl border border-gold-400/20 bg-dark-800/40 p-2">
                <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gold-300">
                  Painel Demo
                </p>
                <div className="grid gap-1">
                  {internalLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleInternalLinkClick}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gold-400/10 hover:text-gold-300"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
