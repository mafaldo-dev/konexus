import React from 'react';
import LeadFilters from './LeadFilters';

import LeadGrid from './LeadGrid';

import { useLeads } from '../../../hooks/_crm/useLeads';

const LeadsPage: React.FC = () => {
  const {
    leads,
    isLoading,
    handleAddLead,
    handleEditLead,
    handleConvertLead,
    handleFilterChange,
  } = useLeads();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gestão de Leads</h1>

      <div className="flex justify-between items-center mb-6">
        <LeadFilters onFilterChange={handleFilterChange} />
        <button
          onClick={handleAddLead}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md"
        >
          Adicionar Novo Lead
        </button>
      </div>
{/* 
      {showForm && (
        <LeadForm
          lead={}
          //onSubmit={handleSaveLead}
          onCancel={handleCancelForm}
        />
      )} */}

      <LeadGrid
        leads={leads}
        onEdit={handleEditLead}
        onConvert={handleConvertLead}
        isLoading={isLoading}
      />

      
    </div>
  );
};

export default LeadsPage;
