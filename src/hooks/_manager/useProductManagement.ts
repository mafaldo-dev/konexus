import { useState } from 'react';
import { ProductsProps, Products } from '../../service/interfaces';
import {
    handleProductWithCode,
    processInventoryUpdates as apiProcessInventory,
    getKardexByProduct,
    updateProductStock
} from '../../service/api/Administrador/products';

export const useProductManagement = (
    setProduct: React.Dispatch<React.SetStateAction<ProductsProps[]>>
) => {
    const [productCode, setProductCode] = useState<string>("");
    const [addedProduct, setAddedProduct] = useState<Products | null>(null);
    const [count, setCount] = useState(1);
    const [price, setPrice] = useState(0);

    const handleProduct = async () => {
        if (!productCode) return;

        try {
            const productData = await handleProductWithCode(productCode);
            if (productData) {
                setAddedProduct(productData as Products);
                setPrice(productData.price || 0);
                setCount(1);
            } else {
                setAddedProduct(null);
                alert("Nenhum produto encontrado com o código fornecido!");
            }
        } catch (Exception) {
            console.error("Erro ao encontrar produto: ", Exception);
            alert("Erro ao buscar produto!");
        }
    };

    const handleAddProduct = () => {
        if (!addedProduct || count <= 0) {
            alert("Preencha os dados corretamente para adicionar o produto.");
            return;
        }

        // ✅ CORREÇÃO: Verificar estoque correto (stock em vez de quantity)
        if (addedProduct.stock < count) {
            alert(`Estoque insuficiente! Disponível: ${addedProduct.stock}`);
            return;
        }

        setProduct(prev => [
            ...prev,
            {
                id: addedProduct.id,
                product_name: addedProduct.name,
                quantity: count,
                tipe: addedProduct.description,
                price: price,
                code: addedProduct.code,
                location: addedProduct.location,
                current_stock: addedProduct.stock 
            }
        ]);

        setAddedProduct(null);
        setProductCode('');
        setCount(1);
        setPrice(0);
    };

    // ✅ CORREÇÃO: Converter productId de string para number
    const processInventoryUpdates = async (orderId: number, orderItems: ProductsProps[], companyId: number) => {
        try {
            const orderData = {
                orderId,
                orderItems: orderItems.map(item => ({
                    productId: Number(item.id), // ✅ CONVERTE para number
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                companyId
            };

            await apiProcessInventory(orderData);
            return true;
        } catch (error) {
            console.error('Erro ao processar atualizações de estoque:', error);
            throw error;
        }
    };

    // ✅ NOVA: Buscar histórico do Kardex
    const fetchProductKardex = async (productId: string) => {
        try {
            const kardexData = await getKardexByProduct(productId);
            return kardexData;
        } catch (error) {
            console.error('Erro ao buscar histórico do Kardex:', error);
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
        processInventoryUpdates,
        fetchProductKardex
    };
};