import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export default function GoalsChart({ goals, chartType = 'progress' }: any) {
  if (chartType === 'progress') {
    const chartData = goals.map((goal: any) => ({
      name: goal.title.length > 20 ? goal.title.substring(0, 20) + '...' : goal.title,
      progresso: Math.round((goal.current_value / goal.target_value) * 100),
      atual: goal.current_value,
      meta: goal.target_value
    }));

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Progresso das Metas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'progresso') return [`${value}%`, 'Progresso'];
                return [value, name];
              }}
            />
            <Bar dataKey="progresso" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'department') {
    const departmentData = goals.reduce((acc: any, goal: any) => {
      acc[goal.department] = (acc[goal.department] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(departmentData).map(([department, count]) => ({
      name: department,
      value: count
    }));

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Metas por Departamento</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}