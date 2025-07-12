import React from 'react';
import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Campaign } from '../../../service/interfaces';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-slate-900 text-sm leading-tight">{campaign.name}</h4>
          <div className="relative inline-block text-left">
            <button
              onClick={() => onEdit(campaign)}
              className="p-1 rounded hover:bg-slate-200 transition"
              aria-label={`Editar campanha ${campaign.name}`}
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <p>Tipo: {campaign.type}</p>
          <p>Público Alvo: {campaign.targetAudience}</p>
          <p>Início: {format(new Date(campaign.startDate), "dd/MM/yyyy")}</p>
          <p>Término: {format(new Date(campaign.endDate), "dd/MM/yyyy")}</p>
          <p>Orçamento: R$ {campaign.budget?.toFixed(2)}</p>
        </div>

        <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {campaign.status}
        </span>
      </div>
    </motion.div>
  );
};

export default CampaignCard;
