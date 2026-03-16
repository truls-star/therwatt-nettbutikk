import type { Supplier } from '../lib/loadProducts';

type SupplierFilterProps = {
  suppliers: Supplier[];
  selected: string;
  onChange: (supplierId: string) => void;
};

export function SupplierFilter({ suppliers, selected, onChange }: SupplierFilterProps) {
  if (suppliers.length <= 1) return null;

  return (
    <div className="supplier-filter">
      <label>
        Leverandør
        <select value={selected} onChange={(e) => onChange(e.target.value)}>
          <option value="all">Alle leverandører</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.count})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
