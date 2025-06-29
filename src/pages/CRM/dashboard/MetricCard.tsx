import React from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type ColorType = "blue" | "green" | "purple" | "emerald";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color: ColorType;
  isLoading?: boolean;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  isLoading = false,
}: MetricCardProps) {
  const colorClasses: Record<ColorType, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    emerald: "from-emerald-500 to-emerald-600",
  };

  const textColorClasses: Record<ColorType, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    emerald: "text-emerald-600",
  };

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
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-xl rounded-lg p-6">
        <div
          className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-r ${colorClasses[color]} rounded-full opacity-10`}
          aria-hidden="true"
        />
        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} bg-opacity-20 shadow-lg flex items-center justify-center`}
          >
            <Icon className={`${textColorClasses[color]} w-6 h-6`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm text-green-500">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="font-medium">{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
