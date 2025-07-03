import { Supplier } from "../../../../service/interfaces";

interface SupplierFilterProps {
  suppliers: Supplier[];
  selectedSupplier: string;
  onChangeSupplier: (value: string) => void;
  searchTerm: string;
  onChangeSearch: (value: string) => void;
  onClearFilters: () => void;
}

export default function SupplierFilter({
  suppliers,
  selectedSupplier,
  onChangeSupplier,
  searchTerm,
  onChangeSearch,
  onClearFilters,
}: SupplierFilterProps) {
  return (
    <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-md shadow-sm mb-6">
      <input
        type="text"
        placeholder="Buscar produto..."
        value={searchTerm}
        onChange={e => onChangeSearch(e.target.value)}
        className="flex-1 px-3 py-2 border border-slate-400 rounded-md text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-slate-700 transition"
      />

      <select
        value={selectedSupplier}
        onChange={e => onChangeSupplier(e.target.value)}
        className="px-4 py-2 border border-slate-400 rounded-md bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-slate-700 transition"
      >
        <option value="">Todos os fornecedores</option>
        {suppliers.map(supplier => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>

      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-slate-700 text-white rounded-md font-semibold hover:bg-slate-900 transition"
      >
        Limpar filtros
      </button>
    </div>
  );
}
