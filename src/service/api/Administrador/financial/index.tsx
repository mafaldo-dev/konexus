import { collection, getDocs } from "firebase/firestore";
import { Order } from "../../../interfaces";
import { db } from "../../../../firebaseConfig";

export default async function handleOrderSales():Promise<Order[]> {
    try{
        const ordersRef = collection(db, "Orders")
         const snapeshot = await getDocs(ordersRef)

         const orders: Order[] = snapeshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
         })) as Order[]
        return orders
    }catch(error){
        console.error("Erro ao recuperar lista de pedidos", error)
        throw new Error("Erro interno do servidor")
    }
}