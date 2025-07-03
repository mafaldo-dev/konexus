import { collection, addDoc, getDocs, updateDoc, doc, query, where } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Products } from "../../interfaces"

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

export const handleProductWithCode = async (code: string | number) => {
  try {
    const productRef = collection(db, "Estoque")
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


