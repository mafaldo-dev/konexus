import React from 'react';
import OpportunityFilters from '../oportunidades/OpportunityFilter';
import OpportunityForm from '../oportunidades/OpportunityForm';
import OpportunityBoard from '../oportunidades/OpportunityBoard';
import { useOpportunities } from '../../../hooks/_crm/useOpportunities';

const OpportunitiesPage: React.FC = () => {
  const {
    opportunities,
    isLoading,
    showForm,
    handleAddOpportunity,
    handleEditOpportunity,
    handleCancelForm,
    handleFilterChange,
    handleStageChange,
  } = useOpportunities();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gestão de Oportunidades</h1>

      <div className="flex justify-between items-center mb-6">
        <OpportunityFilters onFilterChange={handleFilterChange} />
        <button
          onClick={handleAddOpportunity}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md"
        >
          Adicionar Nova Oportunidade
        </button>
      </div>

      {showForm && (
        <OpportunityForm
         // opportunity={editingOpportunity}
          onSubmit={() => console.log("nothing here!")}
          onCancel={handleCancelForm}
        />
      )}

      <OpportunityBoard
        opportunities={opportunities}
        onEdit={handleEditOpportunity}
        onStageChange={handleStageChange}
        isLoading={isLoading}
      />
    </div>
  );
};

export default OpportunitiesPage;