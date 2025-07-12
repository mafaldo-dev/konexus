import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Target } from "lucide-react";

interface Lead {
  id: string | number;
  name: string;
  created_date: string | Date;
}

interface Opportunity {
  id: string | number;
  title: string;
  created_date: string | Date;
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
      <div className="bg-white p-5 rounded-lg border border-gray-200 max-w-2xl mx-auto">
        <h2 className="font-bold mb-4 text-gray-800">Atividade Recente</h2>
        <div className="flex flex-col gap-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-300 mb-1 rounded"></div>
                  <div className="w-24 h-3 bg-gray-300 rounded"></div>
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
    <div className="bg-white p-5 rounded-lg border border-gray-200 max-w-2xl mx-auto">
      <h2 className="font-bold mb-4 text-gray-800">Atividade Recente</h2>
      <div className="flex flex-col gap-4">
        {allActivities.map((activity, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50"
          >
            <div
              className={`w-8 h-8 rounded-full flex justify-center items-center ${activity.type === "lead" ? "bg-blue-100" : "bg-green-100"}`}>
              {activity.type === "lead" ? (
                <Users className="w-4 h-4 text-blue-600" />
              ) : (
                <Target className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">
                {activity.type === "lead"
                  ? (activity.item as Lead).name
                  : (activity.item as Opportunity).title}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(activity.date), "dd 'de' MMM")}
              </p>
            </div>
            <div className="border border-gray-400 px-2 py-0.5 rounded-full text-xs text-gray-500 font-semibold whitespace-nowrap">
              {activity.type === "lead" ? "Lead" : "Oportunidade"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
