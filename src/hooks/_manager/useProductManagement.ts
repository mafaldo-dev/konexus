import { useState } from 'react';

import { ProductsProps, Products } from '../../service/interfaces';
import { handleProductWithCode } from '../../service/api/Administrador/products';

export const useProductManagement = (
    setProduct: React.Dispatch<React.SetStateAction<ProductsProps[]>>
) => {
    const [productCode, setProductCode] = useState<string>("");
    const [addedProduct, setAddedProduct] = useState<Products | null>(null);
    const [count, setCount] = useState(0);
    const [price, setPrice] = useState(0);

    const handleProduct = async () => {
        if (!productCode) return;
        
        try {
            const productData = await handleProductWithCode(productCode);
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

        setProduct(prev => [
            ...prev,
            {
                id: addedProduct.id,
                product_name: addedProduct.name,
                quantity: count,
                tipe: addedProduct.description,
                price: price,
                code: addedProduct.code,
                location: addedProduct.location
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
        handleProduct,
        handleAddProduct,
    };
};
