"use client"

import type React from "react"

interface TabButtonProps {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

export const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
    }`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
)
