import { collection, doc, getDoc, updateDoc, addDoc, getDocs } from "firebase/firestore";

import { createKardexEntry } from "../kardex"; // ajusta pro seu path real
import { db } from "../../../../firebaseConfig";
import { Order } from "../../../interfaces";

export async function insertOrder(order: Order) {
  try {
    // 1. Verifica se todos os produtos existem e têm saldo suficiente
    for (const item of order.items) {
      if (!item.productId) throw new Error("Produto sem ID!");

      const productRef = doc(db, "Stock", item.productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Produto com ID ${item.productId} não encontrado.`);
      }

      const productData = productSnap.data();
      const newQuantity = (productData.quantity || 0) - item.quantity;

      if (newQuantity < 0) {
        throw new Error(`Saldo insuficiente para o produto ${item.product_name}`);
      }
    }

    // 2. Cria a ordem no Firestore
    const docRef = await addDoc(collection(db, "Orders"), order);

    // 3. Atualiza estoque e cria entradas no Kardex
    for (const item of order.items) {
      const productRef = doc(db, "Stock", item.productId);
      const productSnap = await getDoc(productRef);
      const productData = productSnap.data();

      const newQuantity = (productData?.quantity || 0) - item.quantity;

      await updateDoc(productRef, { quantity: newQuantity });

      await createKardexEntry(
        item.productId,
        "saida",
        item.quantity,
        "Venda realizada",
        docRef.id,
        order.userId || "sistema",
        order.order_number
      );
    }

    return docRef.id;

  } catch (err: any) {
    console.error("Erro ao criar Order de pedido", err.message || err);
    alert(`Erro ao adicionar ordem: ${err.message || "Erro interno"}`);
    throw err;
  }
}




export async function handleAllOrders(searchTerm?: string): Promise<Order[]> {
    try {
        const ordersRef = collection(db, "Orders")
        const snapshot = await getDocs(ordersRef)

        const orders: Order[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Order[]
        return orders
    } catch (Exception) {
        console.error("Erro ao recuperar a lista de Funcionarios!", Exception)
        alert("Erro interno do servidor!!!")
        throw new Error()
    }
}


export async function updateOrderStatus(orderId: string | number, status: string) {
  try {
    const orderRef = doc(db, "Orders", String(orderId))
    await updateDoc(orderRef, { status })
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error)
    alert("Erro ao atualizar o status do pedido no banco de dados.")
    throw new Error("Falha ao atualizar status do pedido")
  }
}