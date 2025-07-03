import { motion, AnimatePresence } from "framer-motion";
import LeadCard from "./LeadCard";
import { Lead } from "../../../service/interfaces";

interface LeadGridProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  isLoading: boolean;
}

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`bg-gray-300 animate-pulse rounded ${className ?? ""}`}
    />
  );
}

export default function LeadGrid({
  leads,
  onEdit,
  onConvert,
  isLoading,
}: LeadGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => ( 
            <div
              key={i}
              className="p-6 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <SkeletonBox className="h-5 w-32 mb-2" />
                    <SkeletonBox className="h-4 w-40" />
                  </div>
                  <SkeletonBox className="h-6 w-16 rounded-full" />
                </div>
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-4 w-24" />
                <div className="flex gap-2">
                  <SkeletonBox className="h-8 w-20" />
                  <SkeletonBox className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {leads.map((lead, index) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <LeadCard 
              lead={lead} 
              onEdit={onEdit} 
              onConvert={onConvert} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
