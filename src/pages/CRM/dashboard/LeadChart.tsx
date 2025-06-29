import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LeadChart({ leads, isLoading }: { leads: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-lg shadow p-4 max-w-full">
        <header className="border-b border-slate-200/60 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Leads por Status</h2>
        </header>
        <div>
          <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const statusCount = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const data = [
    { name: 'Novos', value: statusCount.new || 0, fill: '#3b82f6' },
    { name: 'Contatados', value: statusCount.contacted || 0, fill: '#8b5cf6' },
    { name: 'Qualificados', value: statusCount.qualified || 0, fill: '#06b6d4' },
    { name: 'Convertidos', value: statusCount.converted || 0, fill: '#10b981' },
    { name: 'Perdidos', value: statusCount.lost || 0, fill: '#ef4444' }
  ];

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-xl rounded-lg p-4 max-w-full">
      <header className="border-b border-slate-200/60 mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Leads por Status</h2>
      </header>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
            <YAxis tick={{ fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
