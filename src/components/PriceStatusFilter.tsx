type PriceStatusFilterProps = {
  selected: string;
  onChange: (value: string) => void;
};

export function PriceStatusFilter({ selected, onChange }: PriceStatusFilterProps) {
  return (
    <div className="price-status-filter">
      <label>
        Prisstatus
        <select value={selected} onChange={(e) => onChange(e.target.value)}>
          <option value="all">Alle produkter</option>
          <option value="active">Med pris</option>
          <option value="mangler pris">Uten pris</option>
        </select>
      </label>
    </div>
  );
}
