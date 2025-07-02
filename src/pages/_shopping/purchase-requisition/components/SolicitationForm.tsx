import { useState } from 'react';
import { Plus, Minus, Save, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Supplier } from '../../../../service/interfaces/suppliers';
import { Products } from '../../../../service/interfaces/products';

interface ProductItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface PurchaseOrder {
  supplierId: string;
  supplierName: string;
  deliveryDate: string | Date;
  notes: string;
  products: ProductItem[];
}

interface PredefinedProduct extends Products {
  id: string;
  name: string;
  price: number;
  minimum_stock: number;
  quantity: number;
}

interface PurchaseRequestFormProps {
  suppliers: Supplier[];
  predefinedProducts?: PredefinedProduct[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function PurchaseRequestForm({
  suppliers,
  predefinedProducts = [],
  onSubmit,
  isLoading,
}: PurchaseRequestFormProps) {
  const [formData, setFormData] = useState<PurchaseOrder>({
    supplierId: '',
    supplierName: '',
    deliveryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    notes: '',
    products: predefinedProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      quantity: Math.max(p.minimum_stock - p.quantity, 1),
      price: p.price || 0,
      totalPrice: Math.max(p.minimum_stock - p.quantity, 1) * (p.price || 0),
    })),
  });

  const [newProduct, setNewProduct] = useState<ProductItem>({
    productId: '',
    productName: '',
    quantity: 1,
    price: 0,
    totalPrice: 0,
  });

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setFormData((prev) => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || '',
      deliveryDate: supplier?.deliveryTime
        ? format(addDays(new Date(), supplier.deliveryTime), 'yyyy-MM-dd')
        : prev.deliveryDate,
    }));
  };

  const addProduct = () => {
    const updatedProduct = {
      ...newProduct,
      totalPrice: newProduct.quantity * newProduct.price,
    };

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, updatedProduct],
    }));

    setNewProduct({ productId: '', productName: '', quantity: 1, price: 0, totalPrice: 0 });
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () =>
    formData.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request = {
      ...formData,
      requestNumber: `REQ-${Date.now()}`,
      requestDate: format(new Date(), 'yyyy-MM-dd'),
      totalAmount: calculateTotal(),
      status: 'pending',
    };
    onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SUPPLIER */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Informações da solicitação</h2>
        <p className="text-sm text-slate-500 mb-6">Informações básicas da solicitação</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-slate-700 block mb-1">Fornecedor *</label>
            <select
              required
              value={formData.supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-slate-700"
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-700 block mb-1">Previsão de entrega</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="date"
                value={formData.deliveryDate.toString()}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))
                }
                className="w-full border border-slate-300 rounded pl-10 pr-3 py-2 text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRODUTO NOVO */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Adicionar Produto</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nome do produto"
            value={newProduct.productName}
            onChange={(e) =>
              setNewProduct((prev) => ({ ...prev, productName: e.target.value }))
            }
            className="border border-slate-300 rounded px-3 py-2"
          />
          <input
            type="number"
            min={1}
            placeholder="Quantidade"
            value={newProduct.quantity}
            onChange={(e) =>
              setNewProduct((prev) => ({
                ...prev,
                quantity: parseInt(e.target.value),
              }))
            }
            className="border border-slate-300 rounded px-3 py-2"
          />
          <input
            type="number"
            step={0.01}
            min={0}
            placeholder="Preço unitário"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct((prev) => ({
                ...prev,
                price: parseFloat(e.target.value),
              }))
            }
            className="border border-slate-300 rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={addProduct}
            className="bg-slate-700 text-white px-4 py-2 rounded flex items-center gap-2 justify-center hover:bg-slate-800 transition"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>

        {/* TABELA */}
        {formData.products.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-center">Preço un.</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {formData.products.map((product, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{product.productName}</td>
                    <td className="px-4 py-3 text-center">{product.quantity}</td>
                    <td className="px-4 py-3 text-center">R$ {product.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-800">
                      R$ {product.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Remover"
                      >
                        <Minus size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right text-xl font-semibold text-slate-800 mt-4">
              Total:{' '}
              <span className="text-slate-700">
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* NOTAS */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Nota</h2>
        <p className="text-sm text-slate-500 mb-4">Informações adicionais</p>
        <textarea
          rows={4}
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Adicionar informações à solicitação..."
          className="w-full border border-slate-300 rounded px-3 py-2 resize-y"
        />
      </div>

      {/* ENVIAR */}
      <div className="text-right">
        <button
          type="submit"
          disabled={isLoading || !formData.supplierId || formData.products.length === 0}
          className="bg-slate-700 text-white px-6 py-3 rounded flex items-center gap-2 text-base font-medium disabled:opacity-60"
        >
          <Save size={18} />
          {isLoading ? 'Salvando...' : 'Enviar Solicitação'}
        </button>
      </div>
    </form>
  );
}
