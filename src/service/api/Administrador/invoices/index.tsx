import { apiRequest } from "../../api"
import { InvoiceDataEntries } from "../../../interfaces"

export default async function invoiceEntries(invoice: InvoiceDataEntries) {
  try {
    // Envia a nota fiscal para o backend
    const response = await apiRequest("invoice/create", "POST", {
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
