import { collection, doc, getDoc, updateDoc, addDoc, getDocs, runTransaction } from "firebase/firestore";

import { createKardexEntry } from "../kardex"; 
import { db } from "../../../../firebaseConfig";
import { Order } from "../../../interfaces";

export async function getNextOrderNumber(): Promise<string> {
  const counterRef = doc(db, "counters", "Orders");
  const PREFIX = "PED-"; // Prefixo definido uma única vez

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    if (!counterSnap.exists()) {
      transaction.set(counterRef, { current: 1 });
      return `${PREFIX}${String(1).padStart(6, "0")}`; // Já retorna formatado
    }

    const current = counterSnap.data().current || 0;
    const next = current + 1;
    transaction.update(counterRef, { current: next });

    return `${PREFIX}${String(next).padStart(6, "0")}`; // Retorna formatado
  });
}


export async function insertOrder(order: Order) {
  try {
    // Gera número sequencial
    const orderNumber = await getNextOrderNumber();

    // Verifica estoque
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

    // Adiciona o número gerado à ordem
    const newOrder: Order = {
      ...order,
      order_number: orderNumber,
    };

    // Cria documento da ordem
    const docRef = await addDoc(collection(db, "Orders"), newOrder);

    // Atualiza estoque e cria entradas no Kardex
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
        String(orderNumber)
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
        console.error("Erro ao recuperar a lista de Pedidos", Exception)
        alert("Erro interno do servidor!!!")
        throw new Error("Erro interno do servidor!!!")
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