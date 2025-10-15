import { useState } from "react";
import { getOrderById } from "../../service/api/Administrador/purchaseRequests";
import { PurchaseOrder } from "../../service/interfaces";

export const useOrderSearch = (setValue: any) => {
  const [orderByCode, setOrderByCode] = useState<string>("");
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [fetchedProducts, setFetchedProducts] = useState<PurchaseOrder['orderItems']>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOrderByCode = async () => {
    if (!orderByCode.trim()) {
      alert("Digite o número do pedido!");
      return;
    }

    try {
        setIsLoading(true);
        const orderData = await getOrderById(orderByCode);

      if (orderData && orderData.id) {
          setOrder(orderData);

          setValue("orderNumber", orderData.orderNumber || "");
          setValue("supplierId", orderData.supplierId || orderData.supplier?.id || "");
          setValue("orderDate", orderData.orderDate ? orderData.orderDate.split('T')[0] : "");
          setValue("orderStatus", orderData.orderStatus || "pending");
          setValue("totalCost", orderData.totalCost || 0);
          setValue("currency", orderData.currency || "BRL");
          setValue("notes", orderData.notes || "");

        if (orderData.supplier) {
          setValue("supplier.id", orderData.supplier.id || "");
          setValue("supplier.name", orderData.supplier.name || "");
          setValue("supplier.email", orderData.supplier.email || "");
          setValue("supplier.phone", orderData.supplier.phone || "");
          setValue("supplier.cnpj", orderData.supplier.cnpj || "");
        
        if (orderData.supplier.address) {
            setValue("supplier.address.street", orderData.supplier.address.street || "");
            setValue("supplier.address.city", orderData.supplier.address.city || "");
            setValue("supplier.address.number", orderData.supplier.address.number || "");
            setValue("supplier.address.state", orderData.supplier.address.state || "");
          }
        }

        if (orderData.requestingCompany) {
            setValue("requestingCompany.id", orderData.requestingCompany.id || "");
            setValue("requestingCompany.name", orderData.requestingCompany.name || "");
            setValue("requestingCompany.buyer", orderData.requestingCompany.buyer || "");
          }

        if (orderData.orderItems && orderData.orderItems.length > 0) {
            setFetchedProducts(orderData.orderItems);
        } else {
            console.warn("⚠️ [HOOK] Nenhum produto encontrado no pedido");
            setFetchedProducts([]);
        }

        if (orderData.createdAt) {
            setValue("createdAt", orderData.createdAt);
        }

        alert(`✅ Pedido ${orderData.orderNumber} carregado com sucesso!`);

      } else {
          alert("❌ Pedido não encontrado!");
          setOrder(null);
          setFetchedProducts([]);
      }

    } catch (err) {
      console.error("❌ [HOOK] Erro ao buscar Pedido:", err);
      alert("Erro ao buscar Pedido! Verifique o console.");
      setOrder(null);
      setFetchedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOrder = () => {
    setOrder(null);
    setFetchedProducts([]);
    setOrderByCode("");
  };

  return { 
    orderByCode, 
    setOrderByCode, 
    order, 
    handleOrderByCode, 
    fetchedProducts,
    isLoading,
    clearOrder
  };
};