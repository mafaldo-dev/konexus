import { useState } from 'react';
import { handleProductWithCode } from '../../service/api/Administrador/products';
import { PurchaseOrder } from '../../service/interfaces';
import Swal from 'sweetalert2';

interface ProductData {
  id: string;
  name: string;
  code: string;
  location?: string;
  coast?: number;
  price?: number;
  stock?: number | any
}

export const useInvoiceProductsManagement = () => {
  const [orderItems, setOrderItems] = useState<PurchaseOrder['orderItems']>([]);
  const [productCode, setProductCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);


  const searchProduct = async () => {
    if (!productCode.trim()) {
      alert('Digite um código de produto!');
      return;
    }

    try {
      const product = await handleProductWithCode(productCode);
      console.log("chamada da funçao => ", product)
      
      if (product) {
        setSelectedProduct(product as ProductData);
        setUnitCost(product.coast || product.price || 0);
        setQuantity(1);
      } else {
        alert('Produto não encontrado!');
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      alert('Erro ao buscar produto!');
    }
  };

  const addProductToInvoice = () => {
    if (!selectedProduct) {
      alert('Selecione um produto!');
      return;
    }

    if (quantity <= 0) {
      alert('Quantidade deve ser maior que zero!');
      return;
    }

    if (unitCost <= 0) {
      alert('Custo deve ser maior que zero!');
      return;
    }

    const existingIndex = orderItems.findIndex(
      item => item.productid === selectedProduct.id
    );

    if (existingIndex !== -1) {
      setOrderItems(prev => prev.map((item, index) => 
        index === existingIndex
          ? {
              ...item,
              quantity: item.quantity + quantity,
              cost: unitCost
            }
          : item
      ));
      Swal.fire('Info','Quantidade do produto atualizada!', 'info');
    } else {
      const newItem: PurchaseOrder['orderItems'][0] = {
        productid: selectedProduct.id,
        quantity: quantity,
        cost: unitCost,
        productname: selectedProduct.name,
        productcode: selectedProduct.code,
        productlocation: selectedProduct.location || ""
      };
      setOrderItems(prev => [...prev, newItem]);
    }

    clearForm();
  };

  const removeItem = (productid: string) => {
    setOrderItems(prev => prev.filter(item => item.productid !== productid));
  };

  const updateItemQuantity = (productid: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productid);
      return;
    }

    setOrderItems(prev => prev.map(item =>
      item.productid === productid
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const updateItemCost = (productid: string, newCost: number) => {
    if (newCost < 0) return;

    setOrderItems(prev => prev.map(item =>
      item.productid === productid
        ? { ...item, cost: newCost }
        : item
    ));
  };


  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  };

  const clearForm = () => {
    setSelectedProduct(null);
    setProductCode('');
    setQuantity(1);
    setUnitCost(0);
  };

  // Limpar nota inteira
  const clearInvoice = () => {
    setOrderItems([]);
    clearForm();
  };

  // Carregar items de um pedido buscado (quando vem da API)
  const loadOrderItems = (items: PurchaseOrder['orderItems']) => {
    setOrderItems(items);
  };

  return {
    // Estado
    orderItems,
    productCode,
    selectedProduct,
    quantity,
    unitCost,
    
    // Setters
    setProductCode,
    setQuantity,
    setUnitCost,
    setOrderItems,
    
    // Ações
    searchProduct,
    addProductToInvoice,
    removeItem,
    updateItemQuantity,
    updateItemCost,
    calculateTotal,
    clearForm,
    clearInvoice,
    loadOrderItems
  };
};