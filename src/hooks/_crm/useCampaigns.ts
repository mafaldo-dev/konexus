
import { useState, useEffect, useCallback } from 'react';

import { Campaign } from '../../service/interfaces';
import { getCampaigns, addCampaign } from '../../service/api/crm/crm';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filters, setFilters] = useState<{ status: string }>({ status: 'all' });

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: Campaign[] = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleSubmit = async (campaignData: Campaign) => {
    try {
      if (editingCampaign) {
        // Implement updateCampaign later
      } else {
        await addCampaign({ ...campaignData, createdAt: new Date() });
      }
      setShowForm(false);
      setEditingCampaign(null);
      loadCampaigns();
    } catch (error) {
      console.error("Erro ao salvar campanha:", error);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    return filters.status === 'all' || campaign.status === filters.status;
  });

  return {
    campaigns: filteredCampaigns,
    isLoading,
    showForm,
    editingCampaign,
    handleSubmit,
    handleEdit,
    handleCancel,
    handleFilterChange,
    setShowForm,
  };
};
