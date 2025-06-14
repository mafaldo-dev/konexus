import { collection, addDoc, getDocs, updateDoc, doc, where, query } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Supplier } from "../../interfaces/suppliers"

export async function insertSupplier (supplier: Supplier) {
    try {
        const docRef = await addDoc(collection(db, "Suppliers"), supplier)
        console.log("Fornecedor cadastrado com sucesso:", docRef.id)
        return docRef.id
    }catch(Exception) {
        console.error("Erro ao adicionar novo fornecedor: ", Exception)
        alert("Erro ao adicionar novo FORNECEDOR... Tente novamente.")
        throw new Error
    }
}

export async function updateSupplier (id: string, updateData: any)  {
    try {
        const supplierRef = doc(db, "Suppliers", id)
        await updateDoc(supplierRef, updateData)
        console.log("Dados do fornecedor atualizados com sucesso!", updateData)
    }catch(Exception) {
        console.error("Erro ao atualizar informações do Fornecedor: ", Exception)
        alert("Erro ao atualizar as informaçoes do Fornecedor.")
        throw new Error
    }
}

export async function getAllSuppliers (serchTerm?: string): Promise<Supplier[]> {
    try {
        const supplierRef = collection(db, "Suppliers")
        const snapshot = await getDocs(supplierRef)

        const suppliers: Supplier[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Supplier[]
        return suppliers
    }catch(Exception) {
        console.error("Erro ao recuperar Fornecedores: ", Exception)
        alert("Erro ao recuperar a lista de fornecedores")
        throw new Error
    }
}

export const handleSupplierWithCode = async (code: string) => {
  try {
    const productRef = collection(db, "Suppliers")
    const get = query(productRef, where("code", "==", String (code)))
    const snapshot = await getDocs(get)


    if(!snapshot.empty) {
      const doc = snapshot.docs[0]
      console.log(doc)
      return { id: doc.id, ...doc.data() }
    }else {
      console.log("Fornecedor não existe ou não encontrado!")
      return null
    }
  }catch(Exception) {
    console.error("Erro ao recuperar Informações do fornecedor: ", Exception)
    throw new Error ("Erro ao buscar fornecedor pelo codigo")
  }
}