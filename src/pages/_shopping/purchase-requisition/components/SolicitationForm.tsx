"use client";
import { useState } from "react";
import Swal from "sweetalert2";
import { Supplier } from "../../../../service/interfaces";
import { usePurchaseOrder } from "../../../../hooks/_manager/usePurchaseOrder";

interface Props {
  supplierData: Supplier[];
  onSubmitOrder: (payload: any) => Promise<string>;
  isLoading: boolean;
}

export default function PurchaseOrderCreate({ supplierData, onSubmitOrder, isLoading }: Props) {
  // Estados do pedido
  const [supplierId, setSupplierId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("BRL");
  const [notes, setNotes] = useState("");
  const [buyer, setBuyer] = useState(""); // ✅ Adicionei o campo buyer

  // Hook de gerenciamento de produtos
  const {
    orderItems,
    productCode,
    setProductCode,
    selectedProduct,
    quantity,
    setQuantity,
    unitCost,
    setUnitCost,
    searchProduct,
    addProductToOrder,
    removeItem,
    updateItemQuantity,
    updateItemCost,
    calculateTotal,
    clearOrder,
  } = usePurchaseOrder();

  // ======== Enviar pedido =========
  const handleSubmit = async () => {
    if (!supplierId || orderItems.length === 0 || !buyer) {
      Swal.fire("Atenção!", "Preencha fornecedor, produtos e comprador.", "info");
      return;
    }

    // ✅ Estrutura EXATA que o backend espera
    const payload = {
      orderNumber,
      supplierId,
      orderItems: orderItems.map(item => ({
        productId: item.productId,     // ✅ ID do produto (número)
        quantity: item.quantity,       // ✅ Quantidade (número)
        coast: item.coast              // ✅ Custo unitário (número)
      })),
      totalCost: calculateTotal(),     // ✅ Total calculado
      currency,                        // ✅ Moeda
      notes,                           // ✅ Observações
      orderDate: `${orderDate} 00:00:00`, // ✅ Data no formato esperado
      orderStatus: "pending",          // ✅ Status padrão
      buyer                            // ✅ Nome do comprador
    };

    console.log("📤 Payload enviado:", payload);

    try {
      const result = await onSubmitOrder(payload);
      console.log("Log do result",result)
      Swal.fire("Sucesso!", "Pedido criado com sucesso!", "success");
      
      // Limpar formulário
      clearOrder();
      setOrderNumber("");
      setNotes("");
      setSupplierId("");
      setBuyer(""); // ✅ Limpar buyer também
    } catch (err) {
      console.error("❌ Erro ao criar pedido:", err);
      Swal.fire("Erro!", "Falha ao criar pedido.", "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-2xl mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Criar Ordem de Compra</h2>

      {/* Fornecedor */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Fornecedor *</label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="border rounded-lg w-full p-2"
        >
          <option value="">Selecione o fornecedor</option>
          {supplierData.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Comprador */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Comprador *</label>
        <input
          type="text"
          placeholder="Nome do comprador"
          value={buyer}
          onChange={(e) => setBuyer(e.target.value)}
          className="border rounded-lg w-full p-2"
        />
      </div>

      {/* Buscar produto */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Código do produto"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchProduct()}
          className="border rounded-lg p-2 flex-1"
        />
        <button
          onClick={searchProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Buscar
        </button>
      </div>

      {/* Produto encontrado */}
      {selectedProduct && (
        <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-lg mb-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
            <p className="text-sm text-gray-500">Código: {selectedProduct.code}</p>
            {selectedProduct.location && (
              <p className="text-xs text-gray-400">Localização: {selectedProduct.location}</p>
            )}
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-600 mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 border rounded-lg p-2 text-center"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-600 mb-1">Custo Unit.</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-28 border rounded-lg p-2 text-center"
            />
          </div>
          <button
            onClick={addProductToOrder}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
          >
            Adicionar
          </button>
        </div>
      )}

      {/* Lista de itens */}
      {orderItems.length > 0 && (
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Código</th>
              <th className="p-2">Produto</th>
              <th className="p-2">Localização</th>
              <th className="p-2 text-center">Qtd</th>
              <th className="p-2 text-right">Unitário</th>
              <th className="p-2 text-right">Subtotal</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item) => (
              <tr key={item.productId} className="border-t hover:bg-gray-50">
                <td className="p-2 text-sm">{item.productCode}</td>
                <td className="p-2">{item.productName}</td>
                <td className="p-2 text-sm text-gray-600">{item.productLocation || '-'}</td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(item.productId, Number(e.target.value))}
                    className="w-16 border rounded p-1 text-center"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.coast}
                    onChange={(e) => updateItemCost(item.productId, Number(e.target.value))}
                    className="w-24 border rounded p-1 text-right"
                  />
                </td>
                <td className="p-2 text-right font-semibold">R$ {item.subtotal.toFixed(2)}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Total */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl font-semibold text-gray-700">
          Total: R$ {calculateTotal().toFixed(2)}
        </p>
      </div>

      {/* Campos extras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Número do Pedido *</label>
          <input
            type="text"
            placeholder="Ex: OC-001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Data do Pedido *</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Moeda</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border rounded-lg p-2 w-full"
        >
          <option value="BRL">BRL (Real)</option>
          <option value="USD">USD (Dólar)</option>
          <option value="EUR">EUR (Euro)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
        <textarea
          placeholder="Notas adicionais sobre o pedido..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border rounded-lg p-2 w-full"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !supplierId || orderItems.length === 0 || !buyer || !orderNumber}
        className="bg-blue-700 text-white px-5 py-3 rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed w-full font-semibold"
      >
        {isLoading ? 'Criando Pedido...' : 'Criar Pedido de Compra'}
      </button>
    </div>
  );
}