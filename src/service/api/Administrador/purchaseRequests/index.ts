import { addDoc, collection, getDocs } from "firebase/firestore"
import { db } from "../../../../firebaseConfig"
import { PurchaseRequest } from "../../../interfaces"

export async function purchaseRequisition(order: PurchaseRequest ) {
  try {
    const docRef = await addDoc(collection(db, "PurchaseOrders"), order)
    return docRef.id
  } catch (Exception) {
    console.error("Erro ao criar Pedido de compra", Exception)
    alert("Erro ao adicionar ordemd e compra ao sistema!!!")
    throw new Error("Erro interno do servidor!")
  }
}

export async function purchaseAllOrders(searchTerm?: string): Promise<PurchaseRequest[]> {
    try {
        const purchasesRef = collection(db, "PurchaseOrders")
        const snapshot = await getDocs(purchasesRef)

        const purchase: PurchaseRequest[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as PurchaseRequest[]
        return purchase
    } catch (Exception) {
        console.error("Erro ao recuperar a lista de Solicitações de compra!", Exception)
        alert("Erro interno do servidor!!!")
        throw new Error("Erro interno do servidor!")
    }
}

// export async function getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
//   // TODO: Implement actual API call to fetch purchase requests
//   // For now, returning mock data
//   return [
//     {
//       requestNumber: 'REQ-1001',
//       supplierName: 'Fornecedor ABC',
//       deliveryDate: '2025-07-10',
//       requestDate: '2025-07-01',
//       totalAmount: 1234.56,
//       status: 'pending',
//       products: [
//         { productName: 'Produto A', quantity: 2, price: 100.0, totalPrice: 200.0 },
//         { productName: 'Produto B', quantity: 1, price: 1034.56, totalPrice: 1034.56 },
//       ],
//       notes: 'Urgente, entregar até o dia 10.',
//     },
//     {
//       requestNumber: 'REQ-1002',
//       supplierName: 'Fornecedor XYZ',
//       deliveryDate: '2025-07-15',
//       requestDate: '2025-07-05',
//       totalAmount: 500.0,
//       status: 'approved',
//       products: [
//         { productName: 'Produto C', quantity: 5, price: 100, totalPrice: 500 },
//       ],
//       notes: '',
//     },
//   ];
// }
