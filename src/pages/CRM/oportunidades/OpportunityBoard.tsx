import { motion, AnimatePresence } from "framer-motion";
import OpportunityColumn from "./OpportunityColumn";
import { Opportunity, StageOpportunity } from "../../../service/interfaces";

interface OpportunityBoardProps {
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onStageChange: (id: string | number, stageId: string) => void; 
  isLoading: boolean;
}
const stages: StageOpportunity[] = [
  { id: "prospecting", label: "Prospecção", color: "blue" },
  { id: "qualification", label: "Qualificação", color: "purple" },
  { id: "proposal", label: "Proposta", color: "yellow" },
  { id: "negotiation", label: "Negociação", color: "orange" },
  { id: "closed_won", label: "Fechado - Ganho", color: "green" },
  { id: "closed_lost", label: "Fechado - Perdido", color: "red" },
];

function LoadingColumn() {
  return (
    <div className="bg-gray-100 rounded-xl p-4">
      <div className="h-6 w-24 bg-gray-300 rounded mb-4 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-gray-200 rounded-lg animate-pulse">
            <div className="h-4 w-32 bg-gray-400 rounded mb-2" />
            <div className="h-3 w-20 bg-gray-400 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-400 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OpportunityBoard({
  opportunities,
  onEdit,
  onStageChange,
  isLoading,
}: OpportunityBoardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <LoadingColumn key={stage.id} />
        ))}
      </div>
    );
  }

  const groupedOpportunities = stages.reduce<Record<string, Opportunity[]>>(
    (acc, stage) => {
      acc[stage.id] = opportunities.filter((opp) => opp.stage === stage.id);
      return acc;
    },
    {}
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <AnimatePresence>
        {stages.map((stage) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OpportunityColumn
              stage={stage}
              opportunities={groupedOpportunities[stage.id]}
              onEdit={onEdit}
              onStageChange={onStageChange}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
