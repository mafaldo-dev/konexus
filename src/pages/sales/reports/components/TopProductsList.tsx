import React from 'react';

import { PackageCheck } from 'lucide-react';
import { TopProduct } from '..';


interface TopProductsListProps {
  products: TopProduct[]
}

const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-[600px] mx-auto transition hover:shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <PackageCheck className="text-indigo-500 w-5 h-5" />
        <h2 className="text-lg font-semibold text-gray-800">Produtos Mais Vendidos</h2>
      </div>

      <ul className="divide-y divide-gray-200">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex justify-between items-center py-3 text-sm"
          >
            <span className="text-gray-700 truncate">{product.name}</span>
            <span className="font-semibold text-indigo-600">{product.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopProductsList;
