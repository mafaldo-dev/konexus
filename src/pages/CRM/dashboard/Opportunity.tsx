import React from "react";

const stageLabels: { [key: string]: string } = {
  prospecting: "Prospecção",
  qualification: "Qualificação",
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado - Ganho",
  closed_lost: "Fechado - Perdido",
};

const stageColors: { [key: string]: string } = {
  prospecting: "bg-blue-100 text-blue-800",
  qualification: "bg-purple-100 text-purple-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed_won: "bg-green-100 text-green-800",
  closed_lost: "bg-red-100 text-red-800",
};

export default function OpportunityPipeline({ opportunities, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200">
        <h2 className="font-bold mb-4">Pipeline de Oportunidades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="mb-3">
                <div className="bg-gray-200 h-6 w-24 mb-2 rounded"></div>
                <div className="bg-gray-300 h-8 w-16 mb-2 rounded"></div>
                <div className="bg-gray-200 h-4 w-20 rounded"></div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  const stageData = opportunities.reduce((acc: any, opp: any) => {
    if (!acc[opp.stage]) {
      acc[opp.stage] = { count: 0, value: 0 };
    }
    acc[opp.stage].count++;
    acc[opp.stage].value += opp.value || 0;
    return acc;
  }, {});

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <h2 className="font-bold mb-4">Pipeline de Oportunidades</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stageLabels).map(([stage, label]) => (
          <div
            key={stage}
            className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200"
          >
            <span
              className={`inline-block mb-2 px-2 py-1 rounded-full text-xs font-semibold ${stageColors[stage]}`}>
              {label}
            </span>
            <p className="text-2xl font-bold my-2">
              {stageData[stage]?.count || 0}
            </p>
            <p className="text-sm text-gray-500">
              R$ {(stageData[stage]?.value || 0).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
