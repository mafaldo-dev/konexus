export interface ProductItem {
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface PurchaseRequest {
  requestNumber: string;
  supplierName: string;
  deliveryDate: string;
  requestDate: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'completed';
  products: ProductItem[];
  notes: string;
}