import React, { useState, useEffect } from 'react';
import LeadFilters from './LeadFilters';
import LeadForm from './LeadForm';
import LeadGrid from './LeadGrid';
import ConvertModal from './ConvertModal';

import { createLead, updateLead, deleteLead, getLeads } from '../../../service/api/leads'; 
import { createOpportunity } from '../../../service/api/opportunities'; 
import { Lead, OpportunityData } from '../../../service/interfaces';

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<Lead | any>();
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | any>();
  const [filters, setFilters] = useState({ status: 'all', source: 'all' });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const fetchedLeads = await getLeads(filters); // Passa os filtros para a API
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setShowForm(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleSaveLead = async (leadData: Lead | any) => {
    try {
      if (editingLead) {
        await updateLead(leadData.id, leadData);
      } else {
        await createLead(leadData);
      }
      setShowForm(false);
      fetchLeads();
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      fetchLeads();
    } catch (error) {
      console.error("Erro ao deletar lead:", error);
    }
  };

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowConvertModal(true);
  };

  const handleConfirmConvert = async (opportunityData: OpportunityData) => {
    if (leadToConvert) {
      try {
        await createOpportunity(opportunityData);
        // Opcional: Atualizar o status do lead para 'convertido' ou removê-lo
        // await updateLead(leadToConvert.id, { ...leadToConvert, status: 'converted' });
        setShowConvertModal(false);
        setLeadToConvert(null);
        fetchLeads(); // Recarrega os leads para refletir a mudança
      } catch (error) {
        console.error("Erro ao converter lead em oportunidade:", error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingLead(null);
  };

  const handleCancelConvert = () => {
    setShowConvertModal(false);
    setLeadToConvert(null);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const filteredLeads = leads.filter(lead => {
    const statusMatch = filters.status === 'all' || lead.status === filters.status;
    const sourceMatch = filters.source === 'all' || lead.source === filters.source;
    return statusMatch && sourceMatch;
  });

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

      {showForm && (
        <LeadForm
          lead={editingLead}
          onSubmit={handleSaveLead}
          onCancel={handleCancelForm}
        />
      )}

      <LeadGrid
        leads={filteredLeads}
        onEdit={handleEditLead}
        onConvert={handleConvertLead}
        isLoading={isLoading}
      />

      {showConvertModal && (
        <ConvertModal
          lead={leadToConvert}
          onConvert={handleConfirmConvert}
          onCancel={handleCancelConvert}
        />
      )}
    </div>
  );
};

export default LeadsPage;
