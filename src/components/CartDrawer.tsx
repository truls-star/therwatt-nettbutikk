import { X } from 'lucide-react';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/formatters';

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { lines, totals, removeProduct, setQuantity, clear } = useCart();

  return (
    <>
      {open && <button className="scrim" onClick={onClose} aria-label="Lukk handlekurv" />}
      <aside className={`mini-cart ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="mini-cart-header">
          <h3>Handlekurv</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {lines.length === 0 ? (
          <p>Handlekurven er tom.</p>
        ) : (
          <div className="mini-cart-list">
            {lines.map((line) => (
              <article key={line.product_number} className="mini-cart-line">
                <div>
                  <strong>{line.title}</strong>
                  <br />
                  <small>Varenr {line.product_number}</small>
                </div>
                <div className="line-actions">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.product_number, Number(e.target.value))}
                  />
                  <span>{formatPrice(line.price_inc_vat * line.quantity)}</span>
                  <button className="link-button" onClick={() => removeProduct(line.product_number)}>
                    Fjern
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mini-cart-footer">
          {lines.length > 0 && (
            <>
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>Delsum</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Frakt</span>
                  <span>{totals.isFreeShipping ? 'Gratis' : formatPrice(totals.shipping)}</span>
                </div>
                {!totals.isFreeShipping && (
                  <p className="cart-free-shipping-hint">
                    Fri frakt ved kjøp over {formatPrice(totals.freeShippingThreshold)}
                  </p>
                )}
                <div className="cart-summary-row cart-total-row">
                  <strong>Totalt inkl. mva</strong>
                  <strong>{formatPrice(totals.total)}</strong>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={clear} style={{ marginTop: '0.5rem' }}>
                Tøm handlekurv
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
