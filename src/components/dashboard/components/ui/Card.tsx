import type React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm ${className}`}>{children}</div>
)

export const CardHeader: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
)

export const CardContent: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

export const CardTitle: React.FC<CardProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h3>
)

export const CardDescription: React.FC<CardProps> = ({ children, className = "" }) => (
  <p className={`text-sm text-slate-600 mt-1 ${className}`}>{children}</p>
)
