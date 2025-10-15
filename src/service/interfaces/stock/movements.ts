export interface Movement {
  id: number;
  movementtype: 'entrada' | 'saida' | 'previsao'; 
  quantity: number;
  unitprice: string; 
  movementdate: string; 
  orderid: number;
  invoicenumber: string
  purchaseordernumber: string
  productname: string;
  productcode: string;
  movement: number
}