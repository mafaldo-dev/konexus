import type React from "react"

interface TableProps {
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ children, className = "" }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>{children}</table>
  </div>
)

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
)

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
)

export const TableRow: React.FC<TableProps> = ({ children, className = "" }) => (
  <tr className={`border-b transition-colors hover:bg-slate-50/50 ${className}`}>{children}</tr>
)

export const TableHead: React.FC<TableProps> = ({ children, className = "" }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-slate-500 ${className}`}>{children}</th>
)

export const TableCell: React.FC<TableProps> = ({ children, className = "" }) => (
  <td className={`p-4 align-middle ${className}`}>{children}</td>
)
