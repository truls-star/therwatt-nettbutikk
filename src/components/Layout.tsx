import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, Menu, PhoneCall, ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '../config/site';
import logo from '../assets/therwatt-logo.png';
import { useCart } from '../lib/cart';
import { useQuoteList } from '../lib/quoteList';
import { CartDrawer } from './CartDrawer';
import { QuoteDrawer } from './QuoteDrawer';

const navLinkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const location = useLocation();
  const { lineCount } = useCart();
  const { lineCount: quoteCount } = useQuoteList();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/">
            <img src={logo} alt="Therwatt AS logo" />
            <div>
              <strong>Therwatt AS</strong>
              <small>Geoenergi og tekniske energiløsninger</small>
            </div>
          </Link>

          <nav className="desktop-nav" aria-label="Hovednavigasjon">
            {siteConfig.nav.map((item) => (
              <NavLink key={item.to} className={navLinkClass} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <a className="phone-link" href={`tel:${siteConfig.phone}`}>
              <PhoneCall size={16} /> {siteConfig.phone}
            </a>
            <button className="icon-button" onClick={() => setQuoteOpen(true)} aria-label="Vis forespørselsliste">
              <ClipboardList size={18} />
              {quoteCount > 0 && <span className="pill pill-quote">{quoteCount}</span>}
            </button>
            <button className="icon-button" onClick={() => setCartOpen(true)} aria-label="Vis handlekurv">
              <ShoppingCart size={18} />
              {lineCount > 0 && <span className="pill">{lineCount}</span>}
            </button>
            <button className="icon-button mobile-only" onClick={() => setMenuOpen((v) => !v)} aria-label="Åpne meny">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-nav container">
            {siteConfig.nav.map((item) => (
              <NavLink
                key={item.to}
                className={navLinkClass}
                to={item.to}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h3>Therwatt AS</h3>
            <p>Org.nr {siteConfig.orgNumber}</p>
            <p>Telefon: {siteConfig.phone}</p>
            <p>E-post: {siteConfig.email}</p>
          </div>
          <div>
            <h4>Fagområder</h4>
            <p>Geoenergi</p>
            <p>Luft-vann varmepumper</p>
            <p>Vannbåren varme</p>
          </div>
          <div>
            <h4>Navigasjon</h4>
            {siteConfig.nav.map((item) => (
              <Link key={item.to} to={item.to} className="footer-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <QuoteDrawer open={quoteOpen} onClose={() => setQuoteOpen(false)} />

      {location.pathname === '/energy-calculator' && <div className="print-hint">Bruk utskrift for PDF/rapport.</div>}
    </div>
  );
}
