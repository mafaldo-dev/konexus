import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { Plus, Save } from 'lucide-react';
import {
  EnterpriseData,
  Products,
  ProductsProps,
  PurchaseRequest,
  Supplier,
} from '../../../../service/interfaces';
import {
  purchaseAllOrders,
  purchaseRequisition,
} from '../../../../service/api/Administrador/purchaseRequests';
import { useProductManagement } from '../../../../hooks/_manager/useProductManagement';

interface PurchaseRequestFormProps {
  suppliers: Supplier[];
  predefinedProducts?: Products[];
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
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const {
    productCode,
    setProductCode,
    addedProduct,
    count,
    setCount,
    price,
    setPrice,
    handleProduct,
  } = useProductManagement(setProducts);

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

  useEffect(() => {
    const mapped = predefinedProducts.map(p => ({
      id: p.id,
      code: p.code || '',
      product_name: p.name,
      quantity: Math.max(p.minimum_stock - p.quantity, 1),
      price: p.price || 0,
      total_price: Math.max(p.minimum_stock - p.quantity, 1) * (p.price || 0),
    })) satisfies ProductsProps[];

    setProducts(mapped);
    setValue('products', mapped);
  }, [predefinedProducts, setValue]);

  useEffect(() => {
    setValue('products', products.map(p => ({
      ...p,
      total_price: p.total_price ?? 0,
    })));
  }, [products, setValue]);

  // Atualiza o preço e quantidade padrão quando o produto é selecionado
  useEffect(() => {
    if (addedProduct?.price) {
      setPrice(addedProduct.price);
      setCount(1);
    }
  }, [addedProduct, setPrice, setCount]);

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
    if (!addedProduct || count <= 0 || price <= 0) {
      alert('Preencha corretamente os dados do produto.');
      return;
    }

    const newItem: ProductsProps = {
      id: addedProduct.id,
      code: addedProduct.code || '',
      product_name: addedProduct.name,
      quantity: count,
      price,
      total_price: count * price,
    };

    setProducts(prev => [...prev, newItem]);
    setProductCode('');
    setCount(1);
    setPrice(0);
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
      {/* Empresa e Fornecedor */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white p-4 rounded border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Empresa Solicitante</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Nome:</strong> {enterpriseDataDefault.company_name}</div>
            <div><strong>Email:</strong> {enterpriseDataDefault.email}</div>
            <div><strong>CNPJ:</strong> {enterpriseDataDefault.informations.cnpj}</div>
            <div><strong>Telefone:</strong> {enterpriseDataDefault.phone}</div>
            <div><strong>Cidade:</strong> {enterpriseDataDefault.address.city}</div>
            <div><strong>Estado:</strong> {enterpriseDataDefault.address.state}</div>
          </div>
        </section>

        <section className="bg-white p-4 rounded border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Fornecedor</h2>
          <label className="block text-sm font-medium mb-1">Selecione o Fornecedor</label>
          <select
            onChange={(e) => handleSupplierChange(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Selecione...</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          {selectedSupplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
              <div><strong>Nome:</strong> {selectedSupplier.name}</div>
              <div><strong>Email:</strong> {selectedSupplier.email}</div>
              <div><strong>CNPJ:</strong> {selectedSupplier.cnpj}</div>
              <div><strong>Telefone:</strong> {selectedSupplier.phone}</div>
              <div><strong>Cidade:</strong> {selectedSupplier.address?.city}</div>
              <div><strong>Estado:</strong> {selectedSupplier.address?.state}</div>
            </div>
          )}
        </section>
      </div>

      {/* Produtos */}
      <section className="bg-white p-6 rounded shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Produtos</h2>

        {addedProduct && (
          <div className="bg-slate-100 p-4 rounded mb-4 text-sm space-y-1">
            <p><strong>Produto:</strong> {addedProduct.name}</p>
            <p><strong>Código:</strong> {addedProduct.code}</p>
            <p><strong>Marca:</strong> {addedProduct.brand}</p>
            <p><strong>Estoque Atual:</strong> {addedProduct.quantity}</p>
            <p><strong>Preço Unitário:</strong> R$ {addedProduct.price}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 items-center">
          <input
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="Código do Produto"
            className="input"
          />
          <button
            type="button"
            onClick={() => handleProduct()}
            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Buscar
          </button>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input"
            placeholder="Qtd"
          />
          {/* Só exibe o preço, não é input */}
          <div className="px-3 py-2 bg-gray-100 rounded text-center">
            R$ {addedProduct ? addedProduct.price : '0.00'}
          </div>
          <button
            type="button"
            onClick={addProduct}
            className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>

        {products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{product.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">R$ {product.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">R$ {(product.total_price || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Observações */}
      <section className="bg-white p-4 rounded border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Observações</h2>
        <textarea
          {...register('notes')}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Adicione observações relevantes..."
        />
      </section>

      {/* Botão Enviar */}
      <div className="text-right">
        <button
          type="submit"
          disabled={isLoading || products.length === 0}
          className="bg-slate-800 text-white px-6 py-3 rounded flex items-center gap-2 hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {isLoading ? 'Salvando...' : 'Enviar Solicitação'}
        </button>
      </div>
    </form>
  );
}
