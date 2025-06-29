// Dependências React e libs auxiliares
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { format } from "date-fns";

// Tipagem
interface Opportunity {
  id?: string;
  name: string;
  email: string;
  company?: string;
  value: number;
  stage: "Qualificação" | "Proposta" | "Negociação" | "Fechado Ganho" | "Fechado Perdido";
  expectedCloseDate: Date;
  createdAt: Date;
}

// Mock API (substituir por real futuramente)
const getAllOpportunities = async (): Promise<Opportunity[]> => Promise.resolve([]);
const addOpportunity = async (opportunity: Opportunity): Promise<void> => Promise.resolve();

// Estágios + Cores
const stageColors: { [key: string]: string } = {
  "Qualificação": "bg-blue-100 text-blue-800",
  "Proposta": "bg-purple-100 text-purple-800",
  "Negociação": "bg-yellow-100 text-yellow-800",
  "Fechado Ganho": "bg-green-100 text-green-800",
  "Fechado Perdido": "bg-red-100 text-red-800",
};

const OpportunityCard = ({
  opportunity,
  onEdit,
  onStageChange,
  stages,
}: {
  opportunity: Opportunity;
  onEdit: (o: Opportunity) => void;
  onStageChange: (id: string, stage: Opportunity["stage"]) => void;
  stages: { id: Opportunity["stage"]; label: string }[];
}) => (
  <div className="border rounded p-3 shadow bg-white">
    <div className="flex justify-between items-center">
      <strong>{opportunity.name}</strong>
      <button onClick={() => onEdit(opportunity)} className="text-sm text-blue-600">Editar</button>
    </div>
    <p className="text-sm text-gray-600">{opportunity.email}</p>
    {opportunity.company && <p className="text-sm text-gray-500">Empresa: {opportunity.company}</p>}
    <p className="text-sm text-gray-500">Fechamento: {format(new Date(opportunity.expectedCloseDate), "dd/MM/yyyy")}</p>
    <p className="text-sm font-semibold mt-2">R$ {opportunity.value.toLocaleString("pt-BR")}</p>
    <select
      className="mt-2 border p-1 text-sm"
      value={opportunity.stage}
      onChange={(e) => onStageChange(opportunity.id || "", e.target.value as Opportunity["stage"])}
    >
      {stages.map((stage) => (
        <option key={stage.id} value={stage.id}>{stage.label}</option>
      ))}
    </select>
  </div>
);

const OpportunityColumn = ({
  stage,
  opportunities,
  onEdit,
  onStageChange,
  stages,
}: any) => (
  <div className="p-3 bg-gray-50 rounded border">
    <h4 className="font-bold mb-2">{stage.label}</h4>
    <p className="text-sm mb-2 text-gray-600">
      Total: R$ {opportunities.reduce((acc: number, o: Opportunity) => acc + o.value, 0).toLocaleString("pt-BR")}
    </p>
    {opportunities.length === 0 ? (
      <p className="text-sm text-gray-400">Nenhuma oportunidade</p>
    ) : (
      <div className="space-y-2">
        {opportunities.map((o: Opportunity) => (
          <OpportunityCard
            key={o.id}
            opportunity={o}
            onEdit={onEdit}
            onStageChange={onStageChange}
            stages={stages} // <- aqui!
          />
        ))}
      </div>
    )}
  </div>
);

const OpportunityForm = ({ opportunity, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState<Partial<Opportunity>>(opportunity || {
    name: "",
    email: "",
    company: "",
    value: 0,
    stage: "Qualificação",
    expectedCloseDate: new Date(),
    createdAt: new Date(),
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "value" ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 border rounded">
      <h3 className="font-bold">{opportunity ? "Editar" : "Nova"} Oportunidade</h3>
      <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Nome" className="border p-2 w-full" required />
      <input name="email" value={form.email || ""} onChange={handleChange} placeholder="Email" className="border p-2 w-full" required />
      <input name="company" value={form.company || ""} onChange={handleChange} placeholder="Empresa" className="border p-2 w-full" />
      <input name="value" value={form.value || 0} onChange={handleChange} type="number" className="border p-2 w-full" required />
      <select name="stage" value={form.stage} onChange={handleChange} className="border p-2 w-full">
        {Object.keys(stageColors).map(stage => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </select>
      <input name="expectedCloseDate" type="date" value={format(new Date(form.expectedCloseDate || new Date()), 'yyyy-MM-dd')} onChange={(e) => setForm(prev => ({ ...prev, expectedCloseDate: new Date(e.target.value) }))} className="border p-2 w-full" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
      </div>
    </form>
  );
};

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const data = await getAllOpportunities();
    setOpportunities(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (data: Opportunity) => {
    if (!editing) await addOpportunity(data);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleEdit = (opp: Opportunity) => {
    setEditing(opp);
    setShowForm(true);
  };

  const handleStageChange = (id: string, stage: Opportunity["stage"]) => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, stage } : o));
  };

  const stages = [
    { id: "Qualificação", label: "Qualificação" },
    { id: "Proposta", label: "Proposta" },
    { id: "Negociação", label: "Negociação" },
    { id: "Fechado Ganho", label: "Fechado Ganho" },
    { id: "Fechado Perdido", label: "Fechado Perdido" },
  ];

  const grouped = stages.reduce((acc, s) => {
    acc[s.id] = opportunities.filter(o => o.stage === s.id);
    return acc;
  }, {} as { [key: string]: Opportunity[] });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Oportunidades</h1>
          <p className="text-gray-600">Acompanhe seu pipeline de vendas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {showForm && (
        <OpportunityForm
          opportunity={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map(stage => (
          <OpportunityColumn
            key={stage.id}
            stage={stage}
            opportunities={grouped[stage.id] || []}
            onEdit={handleEdit}
            onStageChange={handleStageChange}
          />
        ))}
      </div>
    </div>
  );
}
