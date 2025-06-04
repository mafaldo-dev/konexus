import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Fornecedor } from "../../interfaces/fornecedor"

export async function insertSupplier (supplier: Fornecedor) {
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

export async function getAllSuppliers (serchTerm?: string): Promise<Fornecedor[]> {
    try {
        const supplierRef = collection(db, "Suppliers")
        const snapshot = await getDocs(supplierRef)

        const suppliers: Fornecedor[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Fornecedor[]
        return suppliers
    }catch(Exception) {
        console.error("Erro ao recuperar Fornecedores: ", Exception)
        alert("Erro ao recuperar a lista de fornecedores")
        throw new Error
    }
}