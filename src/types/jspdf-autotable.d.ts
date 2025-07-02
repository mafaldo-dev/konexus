
declare module "jspdf-autotable" {
  interface UserOptions {
    head?: any[][]
    body?: any[][]
    startY?: number
    theme?: "striped" | "grid" | "plain"
    headStyles?: {
      fillColor?: number[]
      textColor?: number[]
      fontSize?: number
      fontStyle?: string
      halign?: string
    }
    styles?: {
      fontSize?: number
      cellPadding?: number
    }
    bodyStyles?: {
      fontSize?: number
      cellPadding?: number
    }
    columnStyles?: {
      [key: number]: {
        halign?: string
        cellWidth?: number
      }
    }
    alternateRowStyles?: {
      fillColor?: number[]
    }
  }

  function autoTable(doc: any, options: UserOptions): void
  export = autoTable
}