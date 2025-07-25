export const getStatusVariant = (status: string) => {
  switch (status) {
    case "pendente":
      return "secondary"
    case "vencido":
    case "rejeitado":
      return "destructive"
    case "pago":
    case "recebido":
    case "aprovado":
      return "default"
    case "enviada":
      return "outline"
    default:
      return "secondary"
  }
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
