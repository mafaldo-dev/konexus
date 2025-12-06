export interface Movement {
  id: number;
  movementtype: 'entrada' | 'saida' | 'previsao'; 
  quantity: number;
  unitprice: string; 
  movementdate: string; 
  orderid: number;
  invoicenumber: string
  ordernumber: string
  productname: string;
  productcode: string;
  movement: number
  stockAfter: number
  stockBefore: number
}