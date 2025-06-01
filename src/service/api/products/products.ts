// service/api/products.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; // Caminho relativo ao seu arquivo firebase.ts
import type { Produto } from "../../interfaces/produtos";

export const getAllProducts = async (): Promise<Produto[] | any> => {
  const produtosRef = collection(db, "Estoque");
  const snapshot = await getDocs(produtosRef);

  const produtos: Produto[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Produto[];

  return produtos;
};
