import { useState, useEffect } from 'react';
import { Products } from '../../types';
import { Supplier } from '../../types';
import { listProducts } from '../../services/productService';
import { listSuppliers } from '../../services/supplierService';


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
      const productsResponse = await listProducts();
      const suppliersResponse = await listSuppliers();

      if (!productsResponse.ok) {
        throw new Error(productsResponse.error || "Não foi possível carregar os produtos.");
      }
      if (!suppliersResponse.ok) {
        throw new Error(suppliersResponse.error || "Não foi possível carregar os fornecedores.");
      }

      setProducts(productsResponse.data || []);
      setSuppliers(suppliersResponse.data || []);
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
