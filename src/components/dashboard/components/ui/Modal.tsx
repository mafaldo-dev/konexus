"use client"

import type React from "react"
import { X } from "lucide-react"
import { Button } from "./Button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "default" | "large" | "full"
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "default" }) => {
  if (!isOpen) return null

  const sizes = {
    default: "max-w-md",
    large: "max-w-3xl",
    full: "max-w-6xl",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-lg w-full mx-4 ${sizes[size]}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
