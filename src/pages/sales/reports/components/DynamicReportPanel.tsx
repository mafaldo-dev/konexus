import React from 'react';
import { BarChart2 } from 'lucide-react';

interface DynamicReportPanelProps {
  title: string;
  data: { [key: string]: any };
  icon?: 'sales' | 'purchases' | 'products' | 'customers';
}

const formatKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

const DynamicReportPanel: React.FC<DynamicReportPanelProps> = ({ title, data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 transition hover:shadow-xl w-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-start">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition min-h-[100px] max-w-[280px] w-full"
          >
            <p className="text-sm text-blue-700 font-medium mb-1 truncate">
              {formatKey(key)}
            </p>
            <p className="text-2xl font-bold text-blue-900 break-words">
              {typeof value === 'number'
                ? value.toLocaleString()
                : String(value).length > 30
                ? value.slice(0, 30) + '...'
                : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicReportPanel;
