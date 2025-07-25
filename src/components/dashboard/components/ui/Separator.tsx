import type React from "react"

interface SeparatorProps {
  orientation?: "horizontal" | "vertical"
  className?: string
}

export const Separator: React.FC<SeparatorProps> = ({ orientation = "horizontal", className = "" }) => (
  <div
    className={`shrink-0 bg-slate-200 ${
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
    } ${className}`}
  />
)
