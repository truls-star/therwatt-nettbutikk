import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, PhoneCall, ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '../config/site';
import logo from '../assets/therwatt-logo.png';
import { useCart } from '../modules/cart/cartStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

export const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const { state, lineCount, totalIncVat, removeProduct, setQuantity } = useCart();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/">
            <img src={logo} alt="Therwatt AS logo" />
            <div>
              <strong>Therwatt AS</strong>
              <small>Geoenergi og tekniske energilosninger</small>
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
            <button className="icon-button" onClick={() => setCartOpen(true)} aria-label="Vis handlekurv">
              <ShoppingCart size={18} />
              {lineCount > 0 && <span className="pill">{lineCount}</span>}
            </button>
            <button className="icon-button mobile-only" onClick={() => setMenuOpen((v) => !v)} aria-label="Aapne meny">
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
            <h4>Fagomrader</h4>
            <p>Geoenergi</p>
            <p>Luft-vann varmepumper</p>
            <p>Vannbaren varme</p>
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

      <aside className={`mini-cart ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen}>
        <div className="mini-cart-header">
          <h3>Handlekurv</h3>
          <button className="icon-button" onClick={() => setCartOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {state.lines.length === 0 ? (
          <p>Ingen produkter i handlekurven enda.</p>
        ) : (
          <div className="mini-cart-list">
            {state.lines.map((line) => (
              <article key={line.productNumber} className="mini-cart-line">
                <div>
                  <strong>{line.name}</strong>
                  <small>Varenr {line.productNumber}</small>
                </div>
                <div className="line-actions">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) => setQuantity(line.productNumber, Number(event.target.value))}
                  />
                  <button className="link-button" onClick={() => removeProduct(line.productNumber)}>
                    Fjern
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mini-cart-footer">
          <p>
            Total inkl. mva: <strong>{totalIncVat.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</strong>
          </p>
          <Link className="btn btn-primary" to="/contact" onClick={() => setCartOpen(false)}>
            Be om tilbud
          </Link>
        </div>
      </aside>

      {cartOpen && <button className="scrim" onClick={() => setCartOpen(false)} aria-label="Lukk handlekurv" />}
      {location.pathname === '/energy-calculator' && <div className="print-hint">Bruk utskrift for PDF/rapport.</div>}
    </div>
  );
};
