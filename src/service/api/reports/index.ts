import { handleAllOrders } from '../orders/index';
import { getAllProducts } from '../products/index';

import { SalesReport, PurchaseReport, TopProduct, TopCustomer, CustomerRank } from '../../interfaces/reports';
import { Order, ProductsProps, Customer } from '../../interfaces';
import { handleAllCustomer } from '../clients/clients';


export const getSalesReports = async (): Promise<SalesReport> => {
  const orders: Order[] = await handleAllOrders();
  if (!orders || orders.length === 0) {
    return { totalSales: 0, numberOfOrders: 0, averageOrderValue: 0 };
  }
  const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const numberOfOrders = orders.length;
  const averageOrderValue = numberOfOrders > 0 ? totalSales / numberOfOrders : 0;

  return { totalSales, numberOfOrders, averageOrderValue };
};

export const getPurchaseReports = async (): Promise<PurchaseReport> => {
  // NOTE: Purchase data is not available in the provided APIs.
  // Returning mock data for now.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        totalPurchases: 75000,
        numberOfInvoices: 120,
        averageInvoiceValue: 625,
      });
    }, 500);
  });
};

export const getTopProducts = async (): Promise<TopProduct[]> => {
  const products: ProductsProps[] = await getAllProducts();
  if (!products) return [];

  // Assuming quantity_sold is a field in your product data
  const sortedProducts = products
    .sort((a, b) => ((b as any).quantity_sold || 0) - ((a as any).quantity_sold || 0))
    .slice(0, 5);

  return sortedProducts.map(p => ({ id: p.id || '', name: p.name, quantitySold: (p as any).quantity_sold || 0 }));
};

export const getTopCustomers = async (): Promise<TopCustomer[]> => {
  const orders: Order[] = await handleAllOrders();
  const clients: Customer[] = await handleAllCustomer();

  if (!orders || !clients) return [];

  const customerSpending: { [key: string]: number } = {};

  for (const order of orders) {
    // Assuming customer_name is the identifier
    if (order.customer_name && order.total_amount) {
      customerSpending[order.customer_name] = (customerSpending[order.customer_name] || 0) + order.total_amount;
    }
  }

  const topCustomers = Object.entries(customerSpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([customerName, totalSpent]) => {
      const client = clients.find(c => c.name === customerName);
      return { id: client?.id || customerName, name: customerName, totalSpent };
    });

  return topCustomers;
};

export const getCustomerRank = async (): Promise<CustomerRank[]> => {
  const topCustomers = await getTopCustomers();
  return topCustomers.map((customer, index) => ({
    rank: index + 1,
    customerId: customer.id,
    name: customer.name,
    totalSpent: customer.totalSpent,
  }));
};