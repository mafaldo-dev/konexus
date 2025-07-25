"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Edit, Building2, Wallet } from "lucide-react"


import { EditAccountForm } from "../forms/EditAccountForm"
import { AddAccountForm } from "../forms/AddAccountForm"
import { formatCurrency } from "../../../../utils/formatters"
import { Button } from "../ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card"
import { Modal } from "../ui/Modal"


interface Account {
  id: number
  nome: string
  tipo: string
  numero: string
  saldo: number
  banco?: string
  agencia?: string
  conta?: string
  gerente?: string
  telefone?: string
  observacoes?: string
}

export const BancosTab: React.FC = () => {
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      nome: "Banco do Brasil",
      tipo: "Conta Corrente",
      numero: "****-1234",
      saldo: 85420,
      banco: "Banco do Brasil S.A.",
      agencia: "1234-5",
      conta: "12345-6",
      gerente: "Maria Silva",
      telefone: "(11) 3333-4444",
      observacoes: "Conta principal para operações comerciais",
    },
    {
      id: 2,
      nome: "Itaú Unibanco",
      tipo: "Conta Poupança",
      numero: "****-5678",
      saldo: 152300,
      banco: "Itaú Unibanco S.A.",
      agencia: "5678-9",
      conta: "56789-0",
      gerente: "João Santos",
      telefone: "(11) 4004-4828",
      observacoes: "Conta para reserva de emergência",
    },
    {
      id: 3,
      nome: "Caixa Empresa",
      tipo: "Dinheiro",
      numero: "N/A",
      saldo: 18500,
      observacoes: "Dinheiro em espécie para pequenas despesas",
    },
  ])

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setIsEditAccountModalOpen(true)
  }

  const handleSaveAccount = (updatedAccount: Account) => {
    setAccounts((prev) => prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc)))
    setIsEditAccountModalOpen(false)
    setEditingAccount(null)
  }

  const handleAddAccount = (newAccountData: any) => {
    const newAccount: Account = {
      ...newAccountData,
      id: Math.max(...accounts.map((a) => a.id)) + 1,
    }
    setAccounts((prev) => [...prev, newAccount])
    setIsAddAccountModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Contas Bancárias</h3>
          <p className="text-sm text-slate-600">Gerencie suas contas e saldos</p>
        </div>
        <Button onClick={() => setIsAddAccountModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{account.nome}</CardTitle>
                  <CardDescription>
                    {account.tipo} • {account.numero}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditAccount(account)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      account.tipo === "Dinheiro"
                        ? "bg-green-100"
                        : account.tipo === "Conta Poupança"
                          ? "bg-orange-100"
                          : "bg-yellow-100"
                    }`}
                  >
                    {account.tipo === "Dinheiro" ? (
                      <Wallet
                        className={`h-5 w-5 ${
                          account.tipo === "Dinheiro"
                            ? "text-green-600"
                            : account.tipo === "Conta Poupança"
                              ? "text-orange-600"
                              : "text-yellow-600"
                        }`}
                      />
                    ) : (
                      <Building2
                        className={`h-5 w-5 ${
                          account.tipo === "Dinheiro"
                            ? "text-green-600"
                            : account.tipo === "Conta Poupança"
                              ? "text-orange-600"
                              : "text-yellow-600"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{formatCurrency(account.saldo)}</p>
                <p className="text-sm text-slate-600">Saldo disponível</p>
                {account.gerente && <p className="text-xs text-slate-500">Gerente: {account.gerente}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para Adicionar Conta */}
      <Modal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        title="Nova Conta Bancária"
        size="large"
      >
        <AddAccountForm onSave={handleAddAccount} onCancel={() => setIsAddAccountModalOpen(false)} />
      </Modal>

      {/* Modal para Editar Conta */}
      <Modal
        isOpen={isEditAccountModalOpen}
        onClose={() => setIsEditAccountModalOpen(false)}
        title="Editar Conta Bancária"
        size="large"
      >
        {editingAccount && (
          <EditAccountForm
            account={editingAccount}
            onSave={handleSaveAccount}
            onCancel={() => setIsEditAccountModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  )
}
