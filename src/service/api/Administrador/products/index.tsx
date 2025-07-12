import { addDoc, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { Products } from "../../../interfaces";
import { createKardexEntry } from "../kardex";


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

    console.log("Produto e movimentação inicial cadastrados com sucesso.");
    return docRef.id;
  } catch (error) {
    console.error("Erro detalhado:", error);
    throw error; // repassa o erro pro onSubmit
  }
}


export const updateProduct = async (id: string, updatedData: any) => {
  try {
    const productRef = doc(db, "Stock", id)
    await updateDoc(productRef, updatedData)
    console.log("Produto atualizado com sucesso!", updatedData)
  } catch (Exception) {
    console.error("Erro ao atualizar o produto:", Exception)
    alert("Erro ao atualizar informações do item!!! ")
    throw new Error()
  }
}



export const handleProductWithCode = async (code: string | number) => {
  try {
    const productRef = collection(db, "Stock")
    const get = query(productRef, where("code", "==", String (code)))
    const snapshot = await getDocs(get)
    console.log(snapshot)

    if(!snapshot.empty) {
      const doc = snapshot.docs[0]
      console.log(doc)
      return { id: doc.id, ...doc.data() }
    }else {
      console.log("Produto não existe ou não encontrado!")
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


