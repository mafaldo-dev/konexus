import { Package, CheckCircle } from 'lucide-react';
import { Products } from '../../../../service/interfaces';
import { useState, useEffect } from 'react';

interface ProductsTableProps {
  products: Products[];
  selectedProducts: Products[];
  onToggleProduct: (product: Products, selected: boolean) => void;
  isLoading: boolean;
}

export default function ProductsTable({
  products,
  selectedProducts,
  onToggleProduct,
  isLoading,
}: ProductsTableProps) {
  const [allSelected, setAllSelected] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  useEffect(() => {
    if (products.length === 0) {
      setAllSelected(false);
      setIndeterminate(false);
      return;
    }

    const numSelected = selectedProducts.length;
    const newAllSelected = numSelected === products.length;
    const newIndeterminate = numSelected > 0 && numSelected < products.length;

    setAllSelected(newAllSelected);
    setIndeterminate(newIndeterminate);
  }, [products, selectedProducts]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-md p-10 flex flex-col items-center">
        <div
          className="w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-4"
          aria-label="Loading spinner"
        />
        <p className="text-slate-500">Carregando produtos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white shadow rounded-md p-14 flex flex-col items-center text-center">
        <CheckCircle size={48} className="text-green-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Estoque atualizado!</h3>
        <p className="text-slate-500">Todos os produtos estao adequados.</p>
      </div>
    );
  }

  // Função para definir cor do badge conforme gravidade do estoque
  const getSeverityClasses = (quantity: number, minimum_stock: number) => {
    if (quantity === 0) return 'bg-red-200 text-red-800';
    if (quantity < minimum_stock * 0.5) return 'bg-yellow-200 text-yellow-800';
    return 'bg-slate-200 text-slate-800';
  };

  const handleSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    products.forEach((product) => onToggleProduct(product, checked));
  };

  return (
    <div className="bg-white shadow rounded-md overflow-x-auto">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Produtos com baixo estoque</h2>
        <p className="text-sm text-slate-600">{products.length} produtos para reposição</p>
      </div>

      <table className="min-w-full table-auto">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="w-12 p-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = indeterminate;
                  }
                }}
                onChange={handleSelectAllClick}
                aria-label="Select all products"
              />
            </th>
            <th className="text-left p-3 font-medium">Produto</th>
            <th className="text-left p-3 font-medium">Estoque</th>
            <th className="text-left p-3 font-medium">Fornecedor</th>
            <th className="text-left p-3 font-medium">Preço</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const isSelected = selectedProducts.some((p) => p.id === product.id);
            const severityClasses = getSeverityClasses(product.stock, product.minimum_stock);

            return (
              <tr
                key={product.id}
                onClick={() => onToggleProduct(product, !isSelected)}
                className={`cursor-pointer ${isSelected ? 'bg-slate-100' : ''}`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    className="accent-slate-700 cursor-pointer"
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleProduct(product, e.target.checked);
                    }}
                    aria-label={`Select product ${product.name}`}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Package size={20} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-sm text-slate-500">SKU: {product.code}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${severityClasses}`}
                    >
                      Saldo = {product.stock}
                    </span>
                    <span className="text-slate-500 text-xs">| Saldo Min = {product.minimum_stock}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600">{product.supplier_id}</td>
                <td className="p-3 font-medium text-slate-900">
                  R$ {product.price || '0.00'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
