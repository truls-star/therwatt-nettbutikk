import { X } from 'lucide-react';
import { useQuoteList } from '../lib/quoteList';

type QuoteDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function QuoteDrawer({ open, onClose }: QuoteDrawerProps) {
  const { lines, removeProduct, setComment, clear } = useQuoteList();

  return (
    <>
      {open && <button className="scrim" onClick={onClose} aria-label="Lukk forespørselsliste" />}
      <aside className={`mini-cart quote-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="mini-cart-header">
          <h3>Forespørselsliste</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {lines.length === 0 ? (
          <p>Forespørselslisten er tom.</p>
        ) : (
          <div className="mini-cart-list">
            {lines.map((line) => (
              <article key={line.product_number} className="mini-cart-line">
                <div>
                  <strong>{line.title}</strong>
                  <br />
                  <small>Varenr {line.product_number}</small>
                  {line.supplier && (
                    <>
                      <br />
                      <small>Leverandør: {line.supplier}</small>
                    </>
                  )}
                </div>
                <div className="quote-line-comment">
                  <textarea
                    placeholder="Kommentar (valgfritt)"
                    value={line.comment}
                    onChange={(e) => setComment(line.product_number, e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="line-actions">
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
              <p className="muted-note">{lines.length} produkt{lines.length !== 1 ? 'er' : ''} i forespørselslisten</p>
              <button className="btn btn-quote" style={{ width: '100%', justifyContent: 'center' }}>
                Send forespørsel
              </button>
              <button className="btn btn-ghost" onClick={clear} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                Tøm liste
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
