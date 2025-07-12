import { useState, useEffect } from 'react';
import { Products, Supplier } from '../../service/interfaces';
import { getAllProducts } from '../../service/api/Administrador/products';
import { getAllSuppliers } from '../../service/api/Administrador/suppliers/supplier';


interface PurchaseData {
  products: Products[];
  suppliers: Supplier[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const usePurchaseData = (): PurchaseData => {
  const [products, setProducts] = useState<Products[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const productsData = await getAllProducts();
      const suppliersData = await getAllSuppliers();
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { products, suppliers, isLoading, error, refetch: loadData };
};
