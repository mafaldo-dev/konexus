import { useState } from 'react';
import { handleProductWithCode } from '../service/api/products';
import { ProductsProps, Products } from '../service/interfaces';

export const useProductManagement = () => {
    const [productCode, setProductCode] = useState<string>("");
    const [addedProduct, setAddedProduct] = useState<Products | null>(null);
    const [count, setCount] = useState(0);
    const [price, setPrice] = useState(0);
    const [products, setProducts] = useState<ProductsProps[]>([]);

    const handleProduct = async () => {
        if (!productCode) return;

        try {
            const productData = await handleProductWithCode(Number(productCode));
            if (productData) {
                setAddedProduct(productData as Products);
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
        if (!addedProduct || count <= 0 || price <= 0) {
            alert("Preencha os dados corretamente para adicionar o produto.");
            return;
        }

        setProducts(prev => [
            ...prev,
            {
                id: addedProduct.id,
                name: addedProduct.name,
                quantity: count,
                tipe: addedProduct.description,
                price: price
            }
        ]);

        setAddedProduct(null);
        setProductCode('');
        setCount(0);
        setPrice(0);
    };

    return {
        productCode,
        setProductCode,
        addedProduct,
        count,
        setCount,
        price,
        setPrice,
        products,
        setProducts,
        handleProduct,
        handleAddProduct,
    };
};