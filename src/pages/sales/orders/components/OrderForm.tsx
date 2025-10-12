import { useForm } from "react-hook-form";
import { Trash2, Package, User, MapPin, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

import { insertOrder, getNextOrderNumber, updateOrder } from "../../../../service/api/Administrador/orders";
import { Order, OrderResponse } from "../../../../service/interfaces/sales/orders";
import { Customer, ProductsProps } from "../../../../service/interfaces";
import { useProductManagement } from "../../../../hooks/_manager/useProductManagement";
import { handleAllCustomers } from "../../../../service/api/Administrador/customer/clients";
import { useAuth } from "../../../../AuthContext";

type FormValues = {
  orderDate: string;
  orderStatus: string;
  customerId: string | number;
  name: string;
  phone: string;
  code: string;
  currency: string;
  salesperson: string;
  notes?: string;
  shippingAddressId?: string | any;
  billingAddressId?: string | any;
};

interface OrderFormProps {
  editMode?: boolean;
  initialData?: OrderResponse;
  orderId?: number;
}

export default function OrderForm({ editMode = false, initialData, orderId }: OrderFormProps) {
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string>("Carregando...");
  const [loadingOrderNumber, setLoadingOrderNumber] = useState(true);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const hasPrefilledData = useRef(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isSalesPerson = user?.role === "Vendedor" && user?.sector === "Comercial";
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      orderStatus: "pending",
      currency: "BRL",
      salesperson: isSalesPerson ? user.username : "",
    },
  });

  const {
    productCode,
    setProductCode,
    addedProduct,
    count,
    setCount,
    price,
    handleProduct,
    handleAddProduct,
    processInventoryUpdates
  } = useProductManagement(setProducts);

  // ==================== EFFECTS ==================== //
  
  // Carregar dados para edição
  useEffect(() => {
    if (editMode && initialData && !hasPrefilledData.current) {
      console.log("📝 [FORM] Preenchendo dados para edição:", initialData);
      hasPrefilledData.current = true;
      
      setValue("orderDate", initialData.orderDate.split('T')[0]);
      setValue("customerId", initialData.customer.id.toString());
      setValue("currency", initialData.currency);
      setValue("salesperson", initialData.salesperson || "");
      setValue("notes", initialData.notes || "");
      setValue("shippingAddressId", initialData.shipping?.id?.toString() || "");
      setValue("billingAddressId", initialData.billing?.id?.toString() || "");
      
      // Preencher produtos ✅ CORRIGIDO: adicionado total_price
      if (initialData.orderItems?.length > 0) {
        const formattedProducts: ProductsProps[] = initialData.orderItems.map(item => ({
          id: item.productId.toString(),
          product_name: item.productName,
          code: item.productCode,
          quantity: item.quantity,
          price: item.unitPrice,
          location: item.location,
          stock: 0,
          total_price: item.quantity * item.unitPrice
        }));
        setProducts(formattedProducts);
      }
      
      // Preencher cliente
      const customerData: Customer = {
        id: initialData.customer.id,
        name: initialData.customer.name,
        phone: initialData.customer.phone || "",
        email: initialData.customer.email || "",
        code: initialData.customer.code,
        address: {
          id: initialData.shipping?.id || initialData.billing?.id || "",
          city: initialData.shipping?.city || initialData.billing?.city || "",
          number: initialData.shipping?.number || initialData.billing?.number || 0,
          street: initialData.shipping?.street || initialData.billing?.street || "",
          zip: initialData.shipping?.zip || initialData.billing?.zip || "",
          type: 'shipping'
        },
        createdAt: new Date().toISOString()
      };
      setSelectedCustomer(customerData);
      
      if (initialData.shipping?.id && initialData.billing?.id) {
        setAddressConfirmed(true);
      }
      
      setOrderNumber(initialData.orderNumber);
    }
  }, [editMode, initialData, setValue]);

  // Gerar número do pedido
  useEffect(() => {
    const loadOrderNumber = async () => {
      if (editMode) return;
      
      try {
        setLoadingOrderNumber(true);
        const newOrderNumber = await getNextOrderNumber();
        setOrderNumber(newOrderNumber);
      } catch {
        setOrderNumber("P-100");
      } finally {
        setLoadingOrderNumber(false);
      }
    };
    loadOrderNumber();
  }, [editMode]);

  // Carregar clientes
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customersData = await handleAllCustomers();
        setCustomers(customersData);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  // ==================== HANDLERS ==================== //

  const refreshOrderNumber = async () => {
    try {
      setLoadingOrderNumber(true);
      const newOrderNumber = await getNextOrderNumber();
      setOrderNumber(newOrderNumber);
    } catch (error) {
      console.error("Erro ao recarregar número do pedido:", error);
    } finally {
      setLoadingOrderNumber(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customerIdNum = parseInt(customerId);
    setValue("customerId", customerIdNum);
    setAddressConfirmed(false);

    const customer = customers.find(c => c.id === customerIdNum);
    if (customer) {
      setSelectedCustomer(customer);
      setValue("shippingAddressId", undefined);
      setValue("billingAddressId", undefined);
    } else {
      setSelectedCustomer(null);
    }
  };

  const useCustomerAddress = () => {
    if (selectedCustomer?.address?.id) {
      const addressId = selectedCustomer.address.id.toString();
      setValue("shippingAddressId", addressId);
      setValue("billingAddressId", addressId);
      setAddressConfirmed(true);
      Swal.fire("Info", "Endereço definido para entrega e cobrança!", "success");
    } else {
      Swal.fire("Aviso", "Este cliente não possui endereço válido cadastrado!", "warning");
    }
  };

  const formatAddress = (customer: Customer) => {
    if (!customer.address) return "Endereço não cadastrado";
    const { street, number, city, zip } = customer.address;
    return `${street}, ${number} - ${city} - ${zip}`;
  };

  const handleAddProductWithStockCheck = () => {
    if (!addedProduct) return;

    const existingProduct = products.find(p => p.id === addedProduct.id);
    const totalQuantity = existingProduct ? existingProduct.quantity + count : count;

    if (totalQuantity > addedProduct.stock) {
      Swal.fire({
        title: "Estoque Insuficiente!",
        html: `Quantidade solicitada: <strong>${totalQuantity}</strong><br>Estoque disponível: <strong>${addedProduct.stock}</strong>`,
        icon: "warning",
        confirmButtonText: "Entendi"
      });
      return;
    }

    handleAddProduct();
  };

  const onSubmit = async (data: FormValues) => {
    if (!isSalesPerson) {
      Swal.fire({
        title: "Acesso Restrito",
        text: "Apenas vendedores do setor comercial podem criar pedidos.",
        icon: "error",
        confirmButtonText: "Entendi"
      });
      return;
    }

    if (products.length === 0) {
      Swal.fire("Info", "Adicione pelo menos um produto ao pedido!", "info");
      return;
    }

    if (!data.customerId) {
      Swal.fire("Info", "Selecione um cliente!", "info");
      return;
    }

    if (!data.shippingAddressId || !data.billingAddressId) {
      Swal.fire("Info", "Defina o endereço para entrega e cobrança.", "question");
      return;
    }

    const stockIssues = products.filter(product => {
      const availableStock = product.stock || 0;
      return product.quantity > availableStock;
    });

    if (stockIssues.length > 0) {
      const productNames = stockIssues.map(p => p.product_name).join(', ');
      Swal.fire({
        title: "Estoque Insuficiente!",
        html: `Os seguintes produtos não têm estoque suficiente:<br><strong>${productNames}</strong>`,
        icon: "error",
        confirmButtonText: "Entendi"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAmount = products.reduce((acc, p) => acc + p.quantity * p.price, 0);

      const orderData: Order = {
        orderDate: data.orderDate,
        orderStatus: "pending",
        orderNumber: orderNumber,
        customerId: data.customerId,
        customerName: selectedCustomer?.name || "",
        customerPhone: selectedCustomer?.phone || "",
        customerCode: selectedCustomer?.code || "",
        totalAmount,
        currency: data.currency,
        salesperson: data.salesperson,
        notes: data.notes,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        orderItems: products.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
          unitPrice: p.price,
          location: p.location,
        })),
      };

      let result;
      
      if (editMode && orderId) {
        console.log("📝 [FORM] Atualizando pedido ID:", orderId);
        result = await updateOrder(orderId, orderData);
      } else {
        console.log("📝 [FORM] Criando novo pedido");
        result = await insertOrder(orderData);
      }

      if (result && (result.id || result.order?.id)) {
        const successOrderId = result.id || result.order?.id;
        const companyId = 1;

        try {
          await processInventoryUpdates(successOrderId, products, companyId);

          Swal.fire({
            title: "Sucesso!",
            html: `
              <div>
                <p><strong>Pedido ${orderNumber} ${editMode ? 'atualizado' : 'criado'} com sucesso!</strong></p>
                <p class="text-sm mt-2">✓ Estoque atualizado</p>
                <p class="text-sm">✓ Movimentação registrada no Kardex</p>
                <p class="text-sm">✓ Aguardando aprovação do financeiro</p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Ver Pedidos"
          });

          navigate("/sales/orders");
        } catch (inventoryError) {
          console.error("Erro no processamento de estoque:", inventoryError);
          Swal.fire({
            title: "Pedido Criado com Alerta",
            html: `
              <div>
                <p><strong>Pedido ${orderNumber} ${editMode ? 'atualizado' : 'criado'}!</strong></p>
                <p class="text-sm mt-2 text-yellow-600">⚠️ Erro ao atualizar estoque</p>
                <p class="text-sm">Entre em contato com o administrador</p>
              </div>
            `,
            icon: "warning",
            confirmButtonText: "Entendi"
          });
          navigate("/sales/orders");
        }
      } else {
        Swal.fire("Erro", `Erro ao ${editMode ? 'atualizar' : 'criar'} pedido.`, "error");
        if (!editMode) refreshOrderNumber();
      }
    } catch (err) {
      console.error(`Erro ao ${editMode ? 'atualizar' : 'criar'} pedido:`, err);
      Swal.fire("Erro", `Erro ao ${editMode ? 'atualizar' : 'criar'} pedido.`, "error");
      if (!editMode) refreshOrderNumber();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER ==================== //

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Informações do Pedido */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <Package className="w-4 h-4 text-slate-600" /> Informações do Pedido
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    Número do Pedido
                    {!editMode && (
                      <button
                        type="button"
                        onClick={refreshOrderNumber}
                        disabled={loadingOrderNumber}
                        className="text-slate-500 hover:text-slate-700 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingOrderNumber ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </label>
                  <input 
                    value={orderNumber} 
                    readOnly 
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono font-bold" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data do Pedido *</label>
                  <input
                    type="date"
                    {...register("orderDate", { required: "Data do pedido é obrigatória" })}
                    className={`w-full border rounded-lg p-3 ${errors.orderDate ? "border-red-300" : "border-gray-300"}`}
                  />
                  {errors.orderDate && <p className="text-red-600 text-sm mt-1">{errors.orderDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <input
                    value={editMode ? orderNumber.includes("P-") ? "Pendente" : orderNumber.includes("A-") ? "Aprovado" : "Processando" : "Pendente - Aguardando Financeiro"}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-3 bg-yellow-50 text-yellow-700 font-medium"
                  />
                  <input type="hidden" {...register("orderStatus")} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vendedor *</label>
                  <input
                    {...register("salesperson", { 
                      required: "Vendedor é obrigatório",
                      validate: () => isSalesPerson || "Apenas vendedores do setor comercial podem criar pedidos"
                    })}
                    className={`w-full border rounded-lg p-3 ${
                      errors.salesperson ? "border-red-300" : "border-gray-300"
                    } ${isSalesPerson ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder={isSalesPerson ? "" : "Digite o nome do vendedor"}
                    readOnly={isSalesPerson}
                  />
                  {errors.salesperson && <p className="text-red-600 text-sm mt-1">{errors.salesperson.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Moeda *</label>
                  <select {...register("currency")} className="w-full border border-gray-300 rounded-lg p-3">
                    <option value="BRL">BRL (Real)</option>
                    <option value="USD">USD (Dólar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <User className="w-4 h-4 text-slate-600" /> Dados do Cliente
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                  <select
                    {...register("customerId", { required: "Cliente é obrigatório" })}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    disabled={loadingCustomers}
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.code} - {customer.email}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-red-600 text-sm mt-1">{errors.customerId.message}</p>}
                </div>

                {selectedCustomer && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Código</label>
                      <input value={selectedCustomer.code} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                      <input value={selectedCustomer.name} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                      <input value={selectedCustomer.phone} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input value={selectedCustomer.email} readOnly className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Endereço Cadastrado
                        {addressConfirmed && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✓ Definido</span>}
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-gray-700">{formatAddress(selectedCustomer)}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={useCustomerAddress} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                            Usar Este Endereço
                          </button>
                          {addressConfirmed && <span className="text-xs text-green-600 font-medium">Endereço definido</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Adicionar Produto */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Adicionar Produto</h2>
              <div className="flex gap-3 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Código do produto"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleProduct()}
                  className="border border-gray-300 p-2 rounded-lg w-48"
                />
                <button type="button" onClick={handleProduct} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
                  Buscar Produto
                </button>
                {addedProduct && (
                  <div className="flex gap-2 items-center ml-4 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-green-800">{addedProduct.name}</span>
                      <span className="text-sm text-green-600">Código: {addedProduct.code}</span>
                      <span className="text-xs text-gray-600">Estoque: {addedProduct.stock}</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={addedProduct.stock}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="border border-gray-300 p-2 rounded-lg w-20"
                      placeholder="Qtd"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">Preço Unit.</span>
                      <span className="font-semibold text-green-700">R$ {price}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">Total</span>
                      <span className="font-semibold text-blue-700">R$ {count * price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProductWithStockCheck}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 bg-slate-800 text-white">
                <h2 className="text-xl font-semibold">Itens do Pedido ({products.length})</h2>
              </div>
              {products.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum produto adicionado</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 text-left">Produto</th>
                          <th className="p-4 text-left">Código</th>
                          <th className="p-4 text-center">Qtd</th>
                          <th className="p-4 text-center">Estoque</th>
                          <th className="p-4 text-right">Preço Unit.</th>
                          <th className="p-4 text-right">Total</th>
                          <th className="p-4 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((item, index) => (
                          <tr key={`${item.id}-${index}`} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="p-4 font-medium">{item.product_name}</td>
                            <td className="p-4 text-gray-600">{item.code}</td>
                            <td className="p-4 text-center">{item.quantity}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                (item.stock || 0) >= item.quantity
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.stock || 0}
                              </span>
                            </td>
                            <td className="p-4 text-right">R$ {item.price}</td>
                            <td className="p-4 text-right font-semibold">R$ {(item.quantity * item.price)}</td>
                            <td className="p-4 text-center">
                              <button 
                                type="button" 
                                onClick={() => setProducts(products.filter((_, i) => i !== index))} 
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-200 text-right">
                    <p className="text-sm text-gray-600 mb-1">Total do Pedido</p>
                    <p className="text-3xl font-bold text-slate-800">
                      R$ {products.reduce((acc, p) => acc + p.quantity * p.price, 0)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Observações */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
              <textarea
                {...register("notes")}
                className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-slate-500"
                placeholder="Adicione observações sobre o pedido..."
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-4 pb-8">
              <button 
                type="button" 
                onClick={() => navigate("/sales/orders")} 
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !isSalesPerson} 
                className={`px-6 py-3 rounded-lg transition-colors ${
                  isSalesPerson 
                    ? "bg-slate-800 text-white hover:bg-slate-900" 
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {!isSalesPerson 
                  ? "Acesso Restrito" 
                  : isSubmitting 
                    ? (editMode ? "Atualizando..." : "Criando...") 
                    : (editMode ? "Atualizar Pedido" : "Criar Pedido")
                }
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}