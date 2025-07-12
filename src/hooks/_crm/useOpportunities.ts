
import { useState, useEffect, useCallback } from 'react';

import { Opportunity } from '../../service/interfaces';
import { getAllOpportunities } from '../../service/api/Administrador/opportunities';

export const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>();
  const [filters, setFilters] = useState<string | any>({ stage: 'all' });

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedOpportunities = await getAllOpportunities();
      setOpportunities(fetchedOpportunities);
    } catch (error) {
      console.error("Erro ao buscar oportunidades:", error);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleAddOpportunity = () => {
    setEditingOpportunity(null);
    setShowForm(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setShowForm(true);
  };

  // const handleSaveOpportunity = async (opportunityData: Opportunity) => {
  //   try {
  //     if (editingOpportunity) {
  //       await updateOpportunity(opportunityData.id, opportunityData);
  //     } else {
  //       await createOpportunity(opportunityData);
  //     }
  //     setShowForm(false);
  //     fetchOpportunities();
  //   } catch (error) {
  //     console.error("Erro ao salvar oportunidade:", error);
  //   }
  // };

  // const handleDeleteOpportunity = async (opportunityId: string) => {
  //   try {
  //     await deleteOpportunity(opportunityId);
  //     fetchOpportunities();
  //   } catch (error) {
  //     console.error("Erro ao deletar oportunidade:", error);
  //   }
  // };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingOpportunity(null);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleStageChange = async (id: string | number, stage: string) => {
    try {
    // await updateOpportunity(id, { stage });
      fetchOpportunities();
    } catch (error) {
      console.error("Erro ao alterar o estágio da oportunidade:", error);
    }
  };

  const filteredOpportunities = opportunities.filter(opportunity => {
    const stageMatch = filters.stage === 'all' || opportunity.stage === filters.stage;
    return stageMatch;
  });

  return {
    opportunities: filteredOpportunities,
    isLoading,
    showForm,
    editingOpportunity,
    handleAddOpportunity,
    handleEditOpportunity,
    // handleSaveOpportunity,
    // handleDeleteOpportunity,
    handleCancelForm,
    handleFilterChange,
    handleStageChange,
  };
};
