import { useState, useCallback } from 'react';
import { OrderResponse } from '../service/interfaces/sales/orders';


export const useConferenceModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  const openModal = useCallback((order: OrderResponse) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  }, []);

  return {
    isModalOpen,
    selectedOrder,
    openModal,
    closeModal
  };
};