import { useState, useEffect } from 'react';
import { OrderResponse } from '../../service/interfaces';
import { handleAllOrders } from '../../service/api/Administrador/orders';


interface UseOrdersResult {
  orders: OrderResponse[];
  isLoading: boolean;
  error: Error | null;
  refetchOrders: () => void;
}

export const useOrders = (): UseOrdersResult => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await handleAllOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, isLoading, error, refetchOrders: fetchOrders };
};
