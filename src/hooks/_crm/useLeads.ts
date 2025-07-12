
import { useState, useEffect, useCallback } from 'react';

import { Lead, OpportunityData } from '../../service/interfaces';
import { getLeads } from '../../service/api/crm/crm';
import { createOpportunity } from '../../service/api/Administrador/opportunities';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<Lead | null>();
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>();
  const [filters, setFilters] = useState({ status: 'all', source: 'all' });

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedLeads = await getLeads(filters);
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleAddLead = () => {
    setEditingLead(null);
    setShowForm(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  // const handleSaveLead = async (leadData: Lead) => {
  //   try {
  //     if (editingLead) {
  //       await updateLead(leadData.id!, leadData);
  //     } else {
  //       await createLead(leadData);
  //     }
  //     setShowForm(false);
  //     fetchLeads();
  //   } catch (error) {
  //     console.error("Erro ao salvar lead:", error);
  //   }
  // };

  // const handleDeleteLead = async (leadId: string) => {
  //   try {
  //     await deleteLead(leadId);
  //     fetchLeads();
  //   } catch (error) {
  //     console.error("Erro ao deletar lead:", error);
  //   }
  // };

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowConvertModal(true);
  };

  const handleConfirmConvert = async (opportunityData: OpportunityData) => {
    if (leadToConvert) {
      try {
        await createOpportunity(opportunityData);
        setShowConvertModal(false);
        setLeadToConvert(null);
        fetchLeads();
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

  return {
    leads: filteredLeads,
    isLoading,
    showForm,
    editingLead,
    showConvertModal,
    leadToConvert,
    handleAddLead,
    handleEditLead,
    // handleSaveLead,
    // handleDeleteLead,
    handleConvertLead,
    handleConfirmConvert,
    handleCancelForm,
    handleCancelConvert,
    handleFilterChange,
  };
};
