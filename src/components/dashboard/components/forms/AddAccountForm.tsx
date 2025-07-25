import type React from "react"
import { useState } from "react"
import { Building2, Wallet, CreditCard, PiggyBank, Plus } from "lucide-react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Select, SelectItem } from "../ui/Select"

interface NewAccount {
  nome: string
  tipo: string
  banco: string
  agencia: string
  conta: string
  saldo: number
  gerente: string
  telefone: string
  observacoes: string
}

interface AddAccountFormProps {
  onSave: (account: NewAccount) => void
  onCancel: () => void
}

export const AddAccountForm: React.FC<AddAccountFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<NewAccount>({
    nome: "",
    tipo: "",
    banco: "",
    agencia: "",
    conta: "",
    saldo: 0,
    gerente: "",
    telefone: "",
    observacoes: "",
  })

  const handleInputChange = (field: keyof NewAccount, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const getAccountIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "conta corrente":
        return <Building2 className="h-5 w-5" />
      case "conta poupança":
        return <PiggyBank className="h-5 w-5" />
      case "cartão de crédito":
        return <CreditCard className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header com ícone */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
        <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
          <Plus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Nova Conta Bancária</h3>
          <p className="text-sm text-slate-600">Adicione uma nova conta ao seu sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome da Conta */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Conta *</label>
          <Input
            value={formData.nome}
            onChange={(e) => handleInputChange("nome", e.target.value)}
            placeholder="Ex: Conta Principal Empresa"
          />
        </div>

        {/* Tipo de Conta */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Conta *</label>
          <Select value={formData.tipo}>
            <SelectItem value="Conta Corrente" onClick={() => handleInputChange("tipo", "Conta Corrente")}>
              Conta Corrente
            </SelectItem>
            <SelectItem value="Conta Poupança" onClick={() => handleInputChange("tipo", "Conta Poupança")}>
              Conta Poupança
            </SelectItem>
            <SelectItem value="Cartão de Crédito" onClick={() => handleInputChange("tipo", "Cartão de Crédito")}>
              Cartão de Crédito
            </SelectItem>
            <SelectItem value="Dinheiro" onClick={() => handleInputChange("tipo", "Dinheiro")}>
              Dinheiro em Espécie
            </SelectItem>
            <SelectItem value="Investimento" onClick={() => handleInputChange("tipo", "Investimento")}>
              Conta Investimento
            </SelectItem>
          </Select>
        </div>

        {/* Banco */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Banco</label>
          <Input
            value={formData.banco}
            onChange={(e) => handleInputChange("banco", e.target.value)}
            placeholder="Ex: Banco do Brasil"
          />
        </div>

        {/* Agência */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Agência</label>
          <Input
            value={formData.agencia}
            onChange={(e) => handleInputChange("agencia", e.target.value)}
            placeholder="Ex: 1234-5"
          />
        </div>

        {/* Número da Conta */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Número da Conta</label>
          <Input
            value={formData.conta}
            onChange={(e) => handleInputChange("conta", e.target.value)}
            placeholder="Ex: 12345-6"
          />
        </div>

        {/* Saldo Inicial */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Saldo Inicial *</label>
          <Input
            type="number"
            value={formData.saldo.toString()}
            onChange={(e) => handleInputChange("saldo", Number.parseFloat(e.target.value) || 0)}
            placeholder="0,00"
          />
        </div>

        {/* Gerente */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Gerente Responsável</label>
          <Input
            value={formData.gerente}
            onChange={(e) => handleInputChange("gerente", e.target.value)}
            placeholder="Ex: João Silva"
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Telefone de Contato</label>
          <Input
            value={formData.telefone}
            onChange={(e) => handleInputChange("telefone", e.target.value)}
            placeholder="Ex: (11) 99999-9999"
          />
        </div>

        {/* Observações */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => handleInputChange("observacoes", e.target.value)}
            placeholder="Informações adicionais sobre a conta..."
            rows={3}
            className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Criar Conta</Button>
      </div>
    </form>
  )
}
