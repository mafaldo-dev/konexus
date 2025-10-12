import { useState } from 'react';
import { Products } from '../../service/interfaces';
import {
    handleProductWithCode,
    processInventoryUpdates as apiProcessInventory,
} from '../../service/api/Administrador/products';

// Interface unificada para produtos no carrinho (VENDAS)
export interface CartProduct {
    id: string;
    product_name: string;
    name?: string;
    quantity: number;
    price: number;
    total_price: number;
    code: string;
    location?: string;
    stock?: number;
    current_stock?: number;
    coast?: number;
    minimum_stock?: number;
    brand?: string;
    supplier_id?: number;
    category?: string;
    companyId?: number;
    description?: string;
    tipe?: string;
}

export const useProductManagement = (
    setProduct: React.Dispatch<React.SetStateAction<CartProduct[]>>
) => {
    const [productCode, setProductCode] = useState<string>("");
    const [addedProduct, setAddedProduct] = useState<Products | null>(null);
    const [count, setCount] = useState(1);
    const [price, setPrice] = useState(0);

    // Buscar produto pelo código
    const handleProduct = async () => {
        if (!productCode.trim()) {
            alert("Por favor, digite um código de produto!");
            return;
        }

        try {
            const productData = await handleProductWithCode(productCode);
            if (productData) {
                setAddedProduct(productData as Products);
                setPrice(productData.price || productData.coast || 0);
                setCount(1);
            } else {
                setAddedProduct(null);
                alert("Nenhum produto encontrado com o código fornecido!");
            }
        } catch (error) {
            console.error("Erro ao encontrar produto: ", error);
            alert("Erro ao buscar produto! Verifique o código e tente novamente.");
        }
    };

    // Adicionar produto ao carrinho
    const handleAddProduct = () => {
        if (!addedProduct) {
            alert("Nenhum produto selecionado para adicionar!");
            return;
        }

        if (count <= 0) {
            alert("A quantidade deve ser maior que zero!");
            return;
        }

        if (price <= 0) {
            alert("O preço deve ser maior que zero!");
            return;
        }

        // Verificar estoque disponível
        if (addedProduct.stock !== undefined && addedProduct.stock < count) {
            alert(`Estoque insuficiente! Disponível: ${addedProduct.stock}`);
            return;
        }

        const newProduct: CartProduct = {
            id: addedProduct.id,
            product_name: addedProduct.name || '',
            name: addedProduct.name || '',
            quantity: count,
            price: price,
            total_price: count * price,
            code: addedProduct.code || '',
            location: addedProduct.location || '',
            stock: addedProduct.stock,
            current_stock: addedProduct.stock,
            coast: addedProduct.coast || price,
            minimum_stock: addedProduct.minimum_stock,
            brand: addedProduct.brand || '',
            supplier_id: addedProduct.supplier_id,
            category: addedProduct.category || '',
            companyId: addedProduct.companyId,
            description: addedProduct.description || '',
            tipe: addedProduct.description
        };

        setProduct(prev => [...prev, newProduct]);

        // Limpa os campos após adicionar
        setAddedProduct(null);
        setProductCode('');
        setCount(1);
        setPrice(0);
    };

    // Remover produto da lista
    const removeProduct = (productId: string) => {
        setProduct(prev => prev.filter(p => p.id !== productId));
    };

    // Atualizar quantidade de um produto na lista
    const updateProductQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeProduct(productId);
            return;
        }

        setProduct(prev => prev.map(p => 
            p.id === productId 
                ? { 
                    ...p, 
                    quantity: newQuantity,
                    total_price: newQuantity * p.price
                  }
                : p
        ));
    };

    // Calcular total da lista de produtos
    const calculateTotal = (products: CartProduct[]) => {
        return products.reduce((total, product) => {
            return total + (product.quantity * product.price);
        }, 0);
    };

    // Processar atualizações de inventário (para após criar o pedido)
    const processInventoryUpdates = async (orderId: number, products: CartProduct[], companyId: number) => {
        try {
            // Formata os dados conforme esperado pela API
            const orderData = {
                orderId,
                companyId,
                orderItems: products.map(p => ({
                    productId: Number(p.id),
                    quantity: p.quantity,
                    unitPrice: p.price
                }))
            };

            await apiProcessInventory(orderData);
            console.log("✅ Inventário atualizado com sucesso");
        } catch (error) {
            console.error("❌ Erro ao processar inventário:", error);
            throw error;
        }
    };

    return {
        productCode,
        setProductCode,
        addedProduct,
        count,
        setCount,
        price,
        setPrice,
        handleProduct,
        handleAddProduct,
        removeProduct,
        updateProductQuantity,
        calculateTotal,
        processInventoryUpdates
    };
};