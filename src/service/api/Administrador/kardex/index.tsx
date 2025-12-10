import { apiRequest } from "../../api";

export const updateProductStock = async (productId: number, stock: number): Promise<any> => {
    try {
        const response = await apiRequest(`products/product/${productId}`, 'PUT', {
            quantity: stock
        });
        return response;
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        throw error;
    }
};

export const createKardexMovement = async (kardexData: {
    productId: number;
    orderId?: number;
    movementType: string;
    quantity: number;
    unitPrice: number;
    companyId: number;
}): Promise<any> => {
    try {
        const response = await apiRequest('kardex/create', 'POST', kardexData);
        return response;
    } catch (error) {
        console.error('Erro ao criar movimentação no Kardex:', error);
        throw error;
    }
};

export const getKardexByProduct = async (productId?: string): Promise<any> => {
    const tkn = localStorage.getItem("token")
    try {
        if (!productId) {
            throw new Error("ID do produto é obrigatório");
        }
        if(!tkn) {
            throw new Error("Token não disponibilizado!")
        }
        
        const response = await apiRequest(`kardex/products/${productId}`, "GET", undefined, tkn as string);   
        return response?.movements || [];
    
    } catch (err) {
        console.error("Erro ao recuperar movimentações do produto:", err);
        throw err;
    }
};


export const getKardexByOrder = async (orderId: string): Promise<any> => {
    try {
        const response = await apiRequest(`orders/${orderId}/kardex`, 'GET');
        return response;
    } catch (error) {
        console.error('Erro ao buscar movimentações do pedido:', error);
        throw error;
    }
};

export const handlekardexMoviment = async (productId?: string): Promise<any> => { 
    const tkn = localStorage.getItem("token")
    try {
        if (!productId) {
            throw new Error("ID do produto é obrigatório");
        }
        if(!tkn) {
            throw new Error("Token não disponibilizado!")
        }
        
        const response = await apiRequest(`kardex/products/${productId}`, "GET", undefined, tkn as string);  
        return response?.movements || [];
    
    } catch (err) {
        console.error("Erro ao recuperar movimentações do produto:", err);
        throw err;
    }
};

export const processInventoryUpdates = async (orderData: {
    orderId: number;
    orderItems: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
    }>;
    companyId: number;
}): Promise<any> => {
    try {
        const kardexPromises = orderData.orderItems.map(item =>
            createKardexMovement({
                productId: item.productId,
                orderId: orderData.orderId,
                movementType: 'saida',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                companyId: orderData.companyId
            })
        );

        const results = await Promise.all(kardexPromises);
        return results;
    } catch (error) {
        console.error('Erro ao processar atualizações de inventário:', error);
        throw error;
    }
};