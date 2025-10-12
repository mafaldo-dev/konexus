export interface Movement {
  id: number;
  movementtype: 'entrada' | 'saida' | 'previsao'; // ✅ lowercase
  quantity: number;
  unitprice: string; // ✅ vem como string do backend
  movementdate: string; // ✅ lowercase
  orderid: number;
  ordernumber: string; // ✅ lowercase
  productname: string;
  productcode: string;
  movement: number
}