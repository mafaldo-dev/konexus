import { useState } from 'react';
import { handleProductWithCode } from '../../service/api/Administrador/products';

// Interface para itens do pedido de compra
export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  productCode: string;
  productLocation?: string;
  quantity: number;
  coast: number; // Custo unitário
  subtotal: number;
}

// Interface para dados do produto vindos da API
interface ProductData {
  id: string;
  name: string;
  code: string;
  location?: string;
  coast?: number;
  price?: number;
}

export const usePurchaseOrder = () => {
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [productCode, setProductCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  // Buscar produto pelo código
  const searchProduct = async () => {
    if (!productCode.trim()) {
      alert('Digite um código de produto!');
      return;
    }

    try {
      const product = await handleProductWithCode(productCode);
      
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

  // Adicionar produto ao pedido
  const addProductToOrder = () => {
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

    // Verificar se produto já existe no pedido
    const existingIndex = orderItems.findIndex(
      item => item.productId === selectedProduct.id
    );

    if (existingIndex >= 0) {
      // Atualizar quantidade se já existir
      setOrderItems(prev => prev.map((item, index) => 
        index === existingIndex
          ? {
              ...item,
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * item.coast
            }
          : item
      ));
    } else {
      // Adicionar novo item
      const newItem: PurchaseOrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        productLocation: selectedProduct.location,
        quantity,
        coast: unitCost,
        subtotal: quantity * unitCost
      };

      setOrderItems(prev => [...prev, newItem]);
    }

    // Limpar campos
    clearForm();
  };

  // Remover item do pedido
  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Atualizar quantidade de um item
  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setOrderItems(prev => prev.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.coast
          }
        : item
    ));
  };

  // Atualizar custo unitário de um item
  const updateItemCost = (productId: string, newCost: number) => {
    if (newCost < 0) return;

    setOrderItems(prev => prev.map(item =>
      item.productId === productId
        ? {
            ...item,
            coast: newCost,
            subtotal: item.quantity * newCost
          }
        : item
    ));
  };

  // Calcular total do pedido
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Limpar formulário
  const clearForm = () => {
    setSelectedProduct(null);
    setProductCode('');
    setQuantity(1);
    setUnitCost(0);
  };

  // Limpar pedido inteiro
  const clearOrder = () => {
    setOrderItems([]);
    clearForm();
  };

  // Formatar itens para enviar à API
  const formatOrderForAPI = () => {
    return orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      coast: item.coast
    }));
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
    addProductToOrder,
    removeItem,
    updateItemQuantity,
    updateItemCost,
    calculateTotal,
    clearForm,
    clearOrder,
    formatOrderForAPI
  };
};