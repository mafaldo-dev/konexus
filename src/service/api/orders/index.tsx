import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Order } from "../../interfaces/orders"

export async function insertOrder(order: Order) {
  try {
    const docRef = await addDoc(collection(db, "Orders"), order)
    return docRef.id
  } catch (Exception) {
    console.error("Erro ao criar Order de pedido", Exception)
    alert("Erro ao adicionar ordem ao sistema!!!")
    throw new Error
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
        throw new Error
    }
}


export async function updateOrderStatus(orderId: string | number, status: string) {
  try {
    const orderRef = doc(db, "Orders", String(orderId))
    await updateDoc(orderRef, { status })
    console.log(`Status do pedido ${orderId} atualizado para ${status}`)
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error)
    alert("Erro ao atualizar o status do pedido no banco de dados.")
    throw new Error("Falha ao atualizar status do pedido")
  }
}