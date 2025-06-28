export const rolePermissions: Record<string, string[]> = {
  "Administrador": ["dashboard", "products", "sales", "customers", "suppliers", "employees", "invoice"],
  "Vendedor": ["sales", "new-order", "order-list", "customers"],
  "Conferente": ["stock", "sales"],
  "Financeiro": ["invoice", "report", "infos"],
  "Comprador": ["suppliers", "products", "invoice"]
};