import { updateDoc, doc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

export async function ResetPassword (id: string, updateData: any) {
    try{
        const resetPassword = doc(db, "Employee", id)
        await updateDoc(resetPassword, updateData)
        console.log("Senha alterada: ", updateData)
    }catch(Exception) {
        console.error("Erro ao realizar alteração de senha", Exception)
        throw new Error("Erro interno do servidor... Entre em contato com o suporte!")
    }
}