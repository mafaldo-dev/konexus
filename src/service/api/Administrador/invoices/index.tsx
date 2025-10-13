import { apiRequest } from "../../api"
import { PurchaseOrder } from "../../../interfaces"

export default async function invoiceEntries(invoice: PurchaseOrder) {
  try {
    // Envia a nota fiscal para o backend
    const response = await apiRequest("/invoices", "POST", {
      ...invoice,
      date: new Date(),
    })

    return response
  } catch (error: any) {
    console.error("Erro ao gerar nota fiscal: ", error)
    alert("Erro ao adicionar a NOTA FISCAL à base de dados!!!")
    throw new Error(error.message || "Erro ao gerar nota fiscal")
  }
}
