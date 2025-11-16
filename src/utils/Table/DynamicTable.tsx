import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DynamicTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  emptyDescription?: string;
  containerHeight?: string;
  minHeight?: string;
  width?: string;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: string | ((item: T, index: number) => string);
  loading?: boolean;
  loadingMessage?: string;
}

export function DynamicTable<T extends Record<string, any>>({
  data,
  columns,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription = "Tente ajustar os filtros de busca",
  containerHeight = "auto",
  minHeight = "auto",
  width = "70vw",
  onRowClick,
  rowClassName = "border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50",
  loading = false,
  loadingMessage = "Carregando...",
}: DynamicTableProps<T>) {

  const getRowClassName = (item: T, index: number): string => {
    if (typeof rowClassName === 'function') {
      return rowClassName(item, index);
    }
    return rowClassName;
  };

  // -------------------------
  // PAGINAÇÃO (25 por página)
  // -------------------------
  const ITEMS_PER_PAGE = 25;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return data.slice(start, end);
  }, [data, page]);

  const nextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setPage(p => Math.max(p - 1, 1));
  // -------------------------

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" 
      style={{ height: containerHeight, minHeight, width }}
    >
      <div className="overflow-x-auto h-full">
        <div className="overflow-y-auto h-full">
          <table className="w-full">
            {/* Cabeçalho */}
            <thead className="bg-slate-800 text-white sticky top-0">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={column.headerClassName || "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Corpo */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <p className="font-medium">{loadingMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-400" />
                      <p className="font-medium">{emptyMessage}</p>
                      <p className="text-sm">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={getRowClassName(item, index)}
                    onClick={() => onRowClick?.(item, index)}
                    style={{ userSelect: "none" }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.className || "px-2 py-1"}
                      >
                        {column.render 
                          ? column.render(item, index)
                          : item[column.key]
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------
         PAGINAÇÃO FOOTER
      ------------------------- */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="text-sm">
            Página {page} de {totalPages}
          </span>

          <button
            onClick={nextPage}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
