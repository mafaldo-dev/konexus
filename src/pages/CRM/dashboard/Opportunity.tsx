import React from "react";

const stageLabels = {
  prospecting: "Prospecção",
  qualification: "Qualificação",
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado - Ganho",
  closed_lost: "Fechado - Perdido",
};

const stageColors = {
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
      <div style={{ backgroundColor: "#fff", padding: 20, borderRadius: 8, border: "1px solid #ccc" }}>
        <h2 style={{ fontWeight: "bold", marginBottom: 16 }}>Pipeline de Oportunidades</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16 }}>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ backgroundColor: "#eee", height: 24, width: 96, marginBottom: 8, borderRadius: 4 }} />
                <div style={{ backgroundColor: "#ddd", height: 32, width: 64, marginBottom: 8, borderRadius: 4 }} />
                <div style={{ backgroundColor: "#eee", height: 16, width: 80, borderRadius: 4 }} />
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
    <div style={{ backgroundColor: "#fff", padding: 20, borderRadius: 8, border: "1px solid #ccc" }}>
      <h2 style={{ fontWeight: "bold", marginBottom: 16 }}>Pipeline de Oportunidades</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16 }}>
        {Object.entries(stageLabels).map(([stage, label]) => (
          <div
            key={stage}
            style={{
              textAlign: "center",
              padding: 16,
              borderRadius: 8,
              backgroundColor: "#f9fafb",
              border: "1px solid #ddd",
            }}
          >
            <span
              style={{
                display: "inline-block",
                marginBottom: 8,
                padding: "4px 8px",
                borderRadius: 12,
                backgroundColor:
                  stage === "prospecting"
                    ? "#DBEAFE"
                    : stage === "qualification"
                    ? "#EDE9FE"
                    : stage === "proposal"
                    ? "#FEF3C7"
                    : stage === "negotiation"
                    ? "#FFEDD5"
                    : stage === "closed_won"
                    ? "#DCFCE7"
                    : "#FEE2E2",
                color:
                  stage === "prospecting"
                    ? "#1E40AF"
                    : stage === "qualification"
                    ? "#5B21B6"
                    : stage === "proposal"
                    ? "#B45309"
                    : stage === "negotiation"
                    ? "#C2410C"
                    : stage === "closed_won"
                    ? "#166534"
                    : "#991B1B",
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {label}
            </span>
            <p style={{ fontSize: 24, fontWeight: "bold", margin: "8px 0" }}>
              {stageData[stage]?.count || 0}
            </p>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              R$ {(stageData[stage]?.value || 0).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
