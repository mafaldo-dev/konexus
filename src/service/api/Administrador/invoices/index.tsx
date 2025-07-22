import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { Invoice } from "../../../interfaces";
import { createKardexEntry } from "../kardex";

export default async function invoiceEntries(invoice: Invoice) {
    try {
        // 1. Adiciona a nota fiscal na coleção "Invoice"
        const docRef = await addDoc(collection(db, "Invoice"), {
            ...invoice,
            date: new Date()
        });

        // 2. Para cada produto da nota, atualiza o estoque e registra no Kardex
        for (const item of invoice.products) {
            const productRef = doc(db, "Stock", item.id);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                console.warn(`Produto com ID ${item.id} não encontrado`)
                continue
            }

            const currentQunatity = productSnap.data().quantity || 0
            const newQuantity = Number(currentQunatity) + Number(item.quantity)
            // Atualiza o estoque
            await updateDoc(productRef, {
                quantity: newQuantity
            });

           // Registra no Kardex
            await createKardexEntry(
              item.id,
              "entrada",
              item.quantity,
              `Entrada de ${item.quantity} unidades via NF ${invoice.dataEnterprise.invoiceNum}`,
              invoice.dataEnterprise.invoiceNum,
              invoice.dataEnterprise.receiver || "Desconhecido"
            );
        }
    } catch (Exception: any) {
        console.error("Erro ao gerar nota fiscal: ", Exception);
        alert("Erro ao adicionar a NOTA FISCAL à base de dados!!!");
        throw new Error(Exception.message || "Erro ao gerar nota fiscal");
    }
}
