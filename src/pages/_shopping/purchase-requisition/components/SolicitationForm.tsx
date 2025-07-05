import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { Plus, Minus, Save } from 'lucide-react';
import {
  EnterpriseData,
  Products,
  PurchaseRequest,
  Supplier
} from '../../../../service/interfaces';
import {
  purchaseAllOrders,
  purchaseRequisition
} from '../../../../service/api/purchaseRequests';

interface ProductItem {
  id: string;
  code: string;
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
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
  onSubmit: (data: PurchaseRequest) => void;
  isLoading: boolean;
}

const enterpriseDataDefault: EnterpriseData = {
  company_name: 'GUIMAN',
  phone: '11 9 xxxx-xxxx',
  email: '03.09gui.mafaldo@gmail.com',
  informations: {
    phantasy_name: 'GUIMAN',
    cnpj: '123.456.13332/12',
  },
  address: {
    state: 'São Paulo',
    city: 'Itaquaquecetuba - SP',
    street: 'N/A',
    num: 0,
  },
  createdAt: 'December - 2024',
  status: 'Ativa',
};

export default function PurchaseRequestForm({
  suppliers,
  predefinedProducts = [],
  onSubmit,
  isLoading,
}: PurchaseRequestFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
  } = useForm<PurchaseRequest>({
    defaultValues: {
      requestDate: format(new Date(), 'yyyy-MM-dd'),
      deliveryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      enterprise_name: '',
      notes: '',
      products: [],
      companyData: {
        id: '',
        code: '',
        company_name: '',
        email: '',
        cnpj: '',
        phone: 0,
        address: {
          state: '',
          city: '',
          street: '',
          number: 0,
        },
      },
      status: 'pending',
    },
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<ProductItem, 'total_price'>>({
    id: '',
    code: '',
    product_name: '',
    quantity: 1,
    price: 0,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    const mapped = predefinedProducts.map(p => ({
      id: p.id,
      code: '',
      product_name: p.name,
      quantity: Math.max(p.minimum_stock - p.quantity, 1),
      price: p.price || 0,
      total_price: Math.max(p.minimum_stock - p.quantity, 1) * (p.price || 0),
    }));
    setProducts(mapped);
    setValue('products', mapped);
  }, [predefinedProducts, setValue]);

  useEffect(() => {
    setValue('products', products);
  }, [products, setValue]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    setSelectedSupplier(supplier);
    setValue('enterprise_name', supplier.name);
    setValue('companyData', {
      id: supplier.id || '',
      code: supplier.code || '',
      company_name: supplier.name,
      email: supplier.email || '',
      cnpj: supplier.cnpj || '',
      phone: Number(supplier.phone) || 0,
      address: {
        state: supplier.address?.state || '',
        city: supplier.address?.city || '',
        street: '',
        number: 0,
      },
    });
    if (supplier.deliveryTime) {
      setValue('deliveryDate', format(addDays(new Date(), supplier.deliveryTime), 'yyyy-MM-dd'));
    }
  };

  const addProduct = () => {
    if (!newProduct.product_name || newProduct.quantity <= 0 || newProduct.price < 0) {
      alert('Preencha corretamente os dados do produto.');
      return;
    }
    const total_price = newProduct.quantity * newProduct.price;
    setProducts(prev => [...prev, { ...newProduct, total_price }]);
    setNewProduct({ id: '', code: '', product_name: '', quantity: 1, price: 0 });
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmitForm: SubmitHandler<PurchaseRequest> = async (data) => {
    const request: PurchaseRequest = {
      ...data,
      requestNumber: `REQ-${Date.now()}`,
      createdAt: new Date(),
      status: 'pending',
    };

    try {
      await purchaseRequisition(request);
      reset();
      setProducts([]);
      await purchaseAllOrders();
      alert('Solicitação criada com sucesso!');
      onSubmit(request);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar solicitação, tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 text-slate-800">
      <div className="grid md:grid-cols-2 gap-6 h-fit">
        <section className="bg-white p-4 rounded border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold mb-4">Empresa Solicitante</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs mb-1">Nome</label>
              <input value={enterpriseDataDefault.company_name} disabled className="w-full border border-gray-200 rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs mb-1">Telefone</label>
              <input value={enterpriseDataDefault.phone} disabled className="w-full border border-gray-200 rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs mb-1">Email</label>
              <input value={enterpriseDataDefault.email} disabled className="w-full border border-gray-200 rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs mb-1">Estado</label>
              <input value={enterpriseDataDefault.address.state} disabled className="w-full border border-gray-200 rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs mb-1">Cidade</label>
              <input value={enterpriseDataDefault.address.city} disabled className="w-full border border-gray-200 rounded px-2 py-1" />
            </div>
          </div>
        </section>

        <section className="bg-white p-4 rounded border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold mb-4">Fornecedor</h2>
          <div className="mb-2">
            <label className="block text-sm mb-1">Selecionar Fornecedor</label>
            <select
              onChange={e => handleSupplierChange(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedSupplier && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs mb-1">Nome</label>
                <input {...register('companyData.company_name')} className="w-full border border-gray-200 rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs mb-1">Telefone</label>
                <input {...register('companyData.phone')} className="w-full border border-gray-200 rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs mb-1">Email</label>
                <input {...register('companyData.email')} className="w-full border border-gray-200 rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs mb-1">Código</label>
                <input {...register('companyData.code')} className="w-full border border-gray-200 rounded px-2 py-1" />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Produtos */}
      <section className="bg-white p-6 rounded shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Produtos</h2>

        {/* Busca por código */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Buscar por código</label>
          <input
            type="text"
            value={searchCode}
            onChange={e => setSearchCode(e.target.value)}
            placeholder="Digite o código do produto"
            className="w-60 border border-slate-300 rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            value={newProduct.product_name}
            onChange={e => setNewProduct(p => ({ ...p, product_name: e.target.value }))}
            placeholder="Produto"
            className="input"
          />
          <input
            type="number"
            value={newProduct.quantity}
            onChange={e => setNewProduct(p => ({ ...p, quantity: +e.target.value }))}
            placeholder="Qtd"
            className="input"
          />
          <input
            type="number"
            step="0.01"
            value={newProduct.price}
            onChange={e => setNewProduct(p => ({ ...p, price: +e.target.value }))}
            placeholder="Preço"
            className="input"
          />
          <button
            type="button"
            onClick={addProduct}
            className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>

        {products.length > 0 && (
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2">Produto</th>
                <th className="p-2">Qtd</th>
                <th className="p-2">Preço</th>
                <th className="p-2">Total</th>
                <th className="p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod, idx) => (
                <tr key={idx} className="text-center">
                  <td className="p-2">{prod.product_name}</td>
                  <td className="p-2">{prod.quantity}</td>
                  <td className="p-2">R$ {prod.price.toFixed(2)}</td>
                  <td className="p-2">R$ {prod.total_price.toFixed(2)}</td>
                  <td className="p-2">
                    <button type="button" onClick={() => removeProduct(idx)} className="text-red-600 hover:text-red-800">
                      <Minus size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Notas e Entrega */}
      <section className="bg-white p-6 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Previsão de entrega</label>
            <input type="date" {...register('deliveryDate')} className="input" />
          </div>
          <div>
            <label className="block mb-1">Notas</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full border border-slate-300 rounded px-3 py-2 resize-y"
              placeholder="Informações adicionais"
            />
          </div>
        </div>
      </section>

      {/* Botão Enviar */}
      <div className="text-right">
        <button
          type="submit"
          disabled={isLoading || products.length === 0}
          className="bg-green-600 text-white px-6 py-3 rounded flex items-center gap-2 hover:bg-green-700 transition"
        >
          <Save size={18} />
          {isLoading ? 'Salvando...' : 'Enviar Solicitação'}
        </button>
      </div>
    </form>
  );
}