import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Target } from "lucide-react";

// Tipagem para um lead
interface Lead {
  id: string | number;
  name: string;
  created_date: string | Date;
  // outras propriedades que o lead pode ter
}

// Tipagem para uma oportunidade
interface Opportunity {
  id: string | number;
  title: string;
  created_date: string | Date;
  // outras propriedades que a oportunidade pode ter
}

interface Activity {
  type: "lead" | "opportunity";
  item: Lead | Opportunity;
  date: string | Date;
}

interface RecentActivityProps {
  leads: Lead[];
  opportunities: Opportunity[];
  isLoading: boolean;
}

export default function RecentActivity({
  leads,
  opportunities,
  isLoading,
}: RecentActivityProps) {
  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 8,
          border: "1px solid #ccc",
          maxWidth: 600,
          margin: "auto",
        }}
      >
        <h2 style={{ fontWeight: "bold", marginBottom: 16 }}>Atividade Recente</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#eee",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      width: 128,
                      height: 16,
                      backgroundColor: "#ddd",
                      marginBottom: 4,
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      width: 96,
                      height: 12,
                      backgroundColor: "#ddd",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

 const allActivities: Activity[] = [
  ...leads.slice(0, 3).map((lead) => ({
    type: "lead" as const,  
    item: lead,
    date: lead.created_date,
  })),
  ...opportunities.slice(0, 3).map((opp) => ({
    type: "opportunity" as const, 
    item: opp,
    date: opp.created_date,
  })),
]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5);

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: 20,
        borderRadius: 8,
        border: "1px solid #ccc",
        maxWidth: 600,
        margin: "auto",
      }}
    >
      <h2 style={{ fontWeight: "bold", marginBottom: 16, color: "#1e293b" }}>
        Atividade Recente
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {allActivities.map((activity, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 8,
              backgroundColor: "rgba(248, 250, 252, 0.5)", // similar to bg-slate-50/50
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor:
                  activity.type === "lead" ? "#bfdbfe" /*blue-100*/ : "#bbf7d0" /*green-100*/,
              }}
            >
              {activity.type === "lead" ? (
                <Users style={{ width: 16, height: 16, color: "#2563eb" }} />
              ) : (
                <Target style={{ width: 16, height: 16, color: "#16a34a" }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: "600", color: "#1e293b", margin: 0 }}>
                {activity.type === "lead"
                  ? (activity.item as Lead).name
                  : (activity.item as Opportunity).title}
              </p>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                {format(new Date(activity.date), "dd 'de' MMM")}
              </p>
            </div>
            <div
              style={{
                border: "1px solid #94a3b8",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 12,
                color: "#64748b",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              {activity.type === "lead" ? "Lead" : "Oportunidade"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
