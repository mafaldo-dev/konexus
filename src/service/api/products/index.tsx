import { collection, addDoc, getDocs, updateDoc, doc, getDoc, query, where } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Products } from "../../interfaces/products"

export async function insertProduct(produto: Products) {
  try {
    const docRef = await addDoc(collection(db, "Estoque"), produto)
    console.log("Produto cadastrado com sucesso, ID:", docRef.id)
    return docRef.id
  } catch (Exception) {
    console.error("Erro ao realizar cadastro do Item", Exception)
    alert("Erro ao adicionar o item a base de dados!!!")
    throw new Error
  }
}
export const updateProduct = async (id: string, updatedData: any) => {
  try {
    const productRef = doc(db, "Estoque", id)
    await updateDoc(productRef, updatedData)
    console.log("Produto atualizado com sucesso!", updatedData)
  } catch (Exception) {
    console.error("Erro ao atualizar o produto:", Exception)
    alert("Erro ao atualizar informações do item!!! ")
    throw new Error
  }
}

export const handleKardex = async (code?: string) => {
  try {
    const productSelected = collection(db, "Estoque")
    const q = query(productSelected, where("code", "==", code))
    const snap = await getDocs(q)

    if(!snap.empty) {
      const doc = snap.docs[0]
      return { id: doc.id, ...doc.data()}
    } else {
      console.log("Produto nao encontrado")
      return null
    }
  }catch(Exception){
    console.error("Erro ao buscar produto com ID:", Exception)
    throw new Error
  }
}


export const getAllProducts = async (searchTerm?: string): Promise<Products[] | any> => {
  try {
    const productRef = collection(db, "Estoque")
    const snapshot = await getDocs(productRef)

    const produtos: Products[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Products[]
    return produtos
  } catch (Exception) {
    console.error("Erro ao recuperar a lista de itens: ", Exception)
    alert("Erro interno do servidor!!!")
    throw new Error
  }
}


