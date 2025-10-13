import { useState } from "react";
import { getOrderById } from "../../service/api/Administrador/purchaseRequests";
import { PurchaseOrder } from "../../service/interfaces";


// No arquivo do hook
export const useOrderSearch = (setValue: any) => {
    const [orderByCode, setOrderByCode] = useState<string>("");
    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [fetchedProducts, setFetchedProducts] = useState<PurchaseOrder['orderItems']>([]); // ✅ Mudou aqui

    const handleOrderByCode = async () => {
        if (!orderByCode) return;
        
        try {
            const orderData = await getOrderById(orderByCode);
            
            if (orderData && orderData.id) {
                setOrder(orderData);
                
                // Preenche formulário...
                setValue("orderNumber", orderData.orderNumber || "");
                setValue("supplierId", orderData.supplierId || "");
                // ... etc
                
                // ✅ Retorna orderItems direto
                if (orderData.orderItems && orderData.orderItems.length > 0) {
                    setFetchedProducts(orderData.orderItems);
                }
            }
        } catch (err) {
            console.error("❌ Erro ao buscar Pedido:", err);
            alert("Erro ao buscar Pedido!");
        }
    };

    return { orderByCode, setOrderByCode, order, handleOrderByCode, fetchedProducts };
};