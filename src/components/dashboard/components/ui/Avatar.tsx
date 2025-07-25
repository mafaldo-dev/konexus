import type React from "react"

interface AvatarProps {
  children: React.ReactNode
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ children, className = "" }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>
)

export const AvatarFallback: React.FC<AvatarProps> = ({ children, className = "" }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-slate-100 ${className}`}>
    {children}
  </div>
)
