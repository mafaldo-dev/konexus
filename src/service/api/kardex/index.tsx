import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Movement } from "../../interfaces";

export const getKardexMovements = async (productId: string): Promise<Movement[]> => {
  try {
    const kardexRef = collection(db, "Kardex");
    const q = query(kardexRef, where("productId", "==", productId));
    const snap = await getDocs(q);

    const movements: Movement[] = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        nfNumber: data.nfNumber,
        productId: data.productId,
        quantity: data.quantity,
        type: data.type,
        user: data.user,
      };
    });

    return movements;
  } catch (error) {
    console.error("Erro ao buscar movimentações do Kardex:", error);
    throw new Error("Erro ao buscar movimentações");
  }
};
