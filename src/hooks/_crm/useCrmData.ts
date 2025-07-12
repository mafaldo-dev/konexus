import { useState, useEffect } from 'react';

import { Lead, Opportunity, Campaign } from '../../service/interfaces';
import { getLeads } from '../../service/api/crm/leads';
import { getAllOpportunities, getCampaigns } from '../../service/api/crm/crm';

export const useCrmData = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [leadsData, opportunitiesData, campaignsData] = await Promise.all([
          getLeads(),
          getAllOpportunities(),
          getCampaigns(),
        ]);
        setLeads(leadsData);
        setOpportunities(opportunitiesData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  return { leads, opportunities, campaigns, isLoading };
};
