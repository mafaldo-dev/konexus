import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Produto } from "../../interfaces/produtos"

export async function insertProduct(produto: any) {
    try {
        const docRef = await addDoc(collection(db, "Estoque"), produto)
        console.log("Produto cadastrado com sucesso, ID:", docRef.id)
        return docRef.id
    } catch(Exception) {
        console.error("Erro ao realizar cadastro do Item", Exception)
        throw new Error
    }
}

export const updateProduct = async (id: string, updatedData: any) => {
  try {
    const productRef = doc(db, "Estoque", id);
    await updateDoc(productRef, updatedData);
    console.log("Produto atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar o produto:", error);
    throw error;
  }
};

export const getAllProducts = async (): Promise<Produto[] | any> => {
  const produtosRef = collection(db, "Estoque");
  const snapshot = await getDocs(produtosRef);

  const produtos: Produto[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Produto[];

  return produtos;
};

