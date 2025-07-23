import { addDoc, collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { Products } from "../../../interfaces";
import { createKardexEntry } from "../kardex";
import Swal from "sweetalert2";

export async function insertProductComKardex(produto: Products) {
  try {
    // Passo 1: Verifica se já existe um produto com o mesmo código
    const productRef = collection(db, "Stock");
    const q = query(productRef, where("code", "==", produto.code));
    const snap = await getDocs(q);

    if (!snap.empty) {
      throw new Error("Produto com este código já está cadastrado.");
    }

    // Passo 2: Cadastra o produto
    const docRef = await addDoc(productRef, produto);

    // Passo 3: Registra entrada no Kardex
    await createKardexEntry(
      docRef.id,
      "entrada",
      Number(produto.quantity ?? 0),
      `Cadastro inicial do produto: ${produto.name} (${produto.brand})`
    );
    return docRef.id;
  } catch (error) {
    console.error("Erro detalhado:", error);
    
  }
}

export const updateProduct = async (id: string, updatedData: any) => {
  try {
    const productRef = doc(db, "Stock", id)
    await updateDoc(productRef, updatedData)
  } catch (Exception) {
    console.error("Erro ao atualizar o produto:", Exception)
    Swal.fire('Error', 'Erro ao atualizar as informações do produto', 'error')
  }
}

export const handleProductWithCode = async (code: string | number) => {
  try {
    const productRef = collection(db, "Stock")
    const get = query(productRef, where("code", "==", String (code)))
    const snapshot = await getDocs(get)

    if(!snapshot.empty) {
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    }else {
      return null
    }
  }catch(Exception) {
    console.error("Erro ao recuperar Informações do produto: ", Exception)
    throw new Error ("Erro ao buscar produto pelo codigo")
  }
}

export const getAllProducts = async (searchTerm?: string): Promise<Products[] | any> => {
  try {
    const productRef = collection(db, "Stock")
    const snapshot = await getDocs(productRef)

    const produtos: Products[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Products[]
    return produtos
  } catch (Exception) {
    console.error("Erro ao recuperar a lista de itens: ", Exception)
    alert("Erro interno do servidor!!!")
    throw new Error()
  }
}

export const deleteProduct = async (id: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Deseja excluir este produto?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  try {
    await deleteDoc(doc(db, "Stock", id));
    Swal.fire("Excluído!", "Produto excluído com sucesso.", "success");
    return true;
  } catch (error) {
    console.error("Erro ao deletar produto: ", error);
    Swal.fire("Erro!", "Erro ao excluir produto.", "error");
    return false;
  }
};


