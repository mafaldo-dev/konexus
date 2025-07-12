import React from "react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isLoading?: boolean;
  trend: string
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-lg shadow-sm p-6 animate-pulse max-w-sm">
        <div className="flex justify-between items-start">
          <div>
            <div className="h-4 w-24 mb-3 bg-gray-300 rounded"></div>
            <div className="h-8 w-16 bg-gray-300 rounded"></div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-300"></div>
        </div>
        <div className="h-4 w-20 mt-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="max-w-sm"
    >
      <div className={`relative overflow-hidden bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-xl rounded-lg p-6`}>
        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-r from-${color}-500 to-${color}-600 bg-opacity-20 shadow-lg flex items-center justify-center`}
          >
            <Icon className={`text-${color}-600 w-6 h-6`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
