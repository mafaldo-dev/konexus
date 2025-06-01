import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

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


