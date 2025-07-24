import React from 'react';
import { TopCustomer, CustomerRank } from '../../../../service/interfaces/reports';
import { Trophy, Gift } from 'lucide-react';

interface TopCustomersPanelProps {
  customers: TopCustomer[]; // Keep this for now, though we might primarily use customerRank
  customerRank: CustomerRank[];
  giftThreshold: number;
  onCustomerClick?: (customer: TopCustomer) => void;
}

const TopCustomersPanel: React.FC<TopCustomersPanelProps> = ({ customers, customerRank, giftThreshold }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full transition hover:shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-indigo-500 w-5 h-5" />
        <h2 className="text-lg font-semibold text-gray-800">Ranking de Clientes</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Clientes que atingirem <strong>R$ {giftThreshold.toLocaleString()}</strong> em compras ganham um <strong>brinde</strong>!
      </p>

      <ul className="divide-y divide-gray-200">
        {customerRank.map((customer) => {
          const atingiuMeta = customer.totalSpent >= giftThreshold;

          return (
            <li key={customer.customerId} className="py-3 text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <p className="font-medium text-gray-800 truncate">
                    {customer.rank}. {customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total: R$ {customer.totalSpent.toLocaleString()}
                  </p>
                  {atingiuMeta && (
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                      <Gift className="w-3.5 h-3.5" />
                      Atingiu a meta!
                    </div>
                  )}
                </div>
                {atingiuMeta && (
                  <div className="text-xs font-bold bg-indigo-100 px-2 py-1 rounded-full text-indigo-700 shadow whitespace-nowrap">
                    🎁 Brinde
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TopCustomersPanel;