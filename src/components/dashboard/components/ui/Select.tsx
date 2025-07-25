"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

interface SelectItemProps {
  children: React.ReactNode
  value: string
  onClick?: () => void
}

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || "")

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <span>{selectedValue || "Selecione..."}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

export const SelectItem: React.FC<SelectItemProps> = ({ children, value, onClick }) => (
  <div className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50" onClick={onClick}>
    {children}
  </div>
)
