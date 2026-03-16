import type { Category } from '../lib/loadProducts';

type CategoryFilterProps = {
  categories: Category[];
  selected: string;
  onChange: (categoryId: string) => void;
};

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  return (
    <div className="category-filter">
      <label>
        Kategori
        <select value={selected} onChange={(e) => onChange(e.target.value)}>
          <option value="all">Alle kategorier</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.count})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
