import { Opportunity } from "../../../service/interfaces/opportunities";
import OpportunityCard from "./OpportunityCard";

interface StageOpportunity {
  id: string;
  label: string;
  color: "blue" | "purple" | "yellow" | "orange" | "green" | "red";
}


interface OpportunityColumnProps {
  stage: StageOpportunity;
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onStageChange: (id: string | number, stageId: string) => void;
}

const stageColors: Record<StageOpportunity["color"], string> = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  green: "bg-green-100 text-green-800 border-green-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

export default function OpportunityColumn({
  stage,
  opportunities,
  onEdit,
  onStageChange,
}: OpportunityColumnProps) {
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-md p-4 h-fit flex flex-col">
      <header className="pb-3 mb-3 border-b border-slate-200/40">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{stage.label}</h3>
          <span
            className={`border px-2 py-0.5 rounded text-xs font-medium ${stageColors[stage.color]}`}
          >
            {opportunities.length}
          </span>
        </div>
        <div className="text-xs text-slate-600 mt-1">
          R$ {totalValue.toLocaleString("pt-BR")}
        </div>
      </header>

      <div className="space-y-3 flex flex-col">
        {opportunities.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-4">
            Nenhuma oportunidade
          </div>
        )}
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            onEdit={onEdit}
            onStageChange={onStageChange}
            stage={stage}
          />
        ))}
      </div>
    </div>
  );
}
