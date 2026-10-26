import React, { useState, useMemo, useEffect } from 'react';
import { Inbox } from 'lucide-react';
import { Products } from '../../types';
import { DataState, DataStateVariant } from '../../components/ui/DataState';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DynamicTableProps<T> {
  /** Desabilite quando a consulta já possui paginação no servidor. */
  pagination?: boolean;
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
  /** Erro de comunicação da consulta. Nunca é exibido como lista vazia. */
  error?: string | null;
  /** Estado específico para erros de acesso, contratação ou contexto. */
  errorVariant?: DataStateVariant;
  onRetry?: () => void;
  handleProductClick?: (product: Products) => void;
  handleContextMenu?: (e: React.MouseEvent, product: Products) => void;
  selectedProduct?: T | null;
}

export function DynamicTable<T extends Record<string, any>>({
  pagination = true,
  data,
  columns,
  emptyMessage = "Não há dados disponíveis.",
  emptyDescription = "Cadastre o primeiro registro ou ajuste os filtros de busca.",
  containerHeight = "auto",
  minHeight = "auto",
  width = "70vw",
  onRowClick,
  rowClassName = "border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50",
  loading = false,
  loadingMessage = "Carregando...",
  error = null,
  errorVariant = "error",
  onRetry,
  handleProductClick,
  handleContextMenu,
  selectedProduct,
}: DynamicTableProps<T>) {

  const getRowClassName = (item: T, index: number): string => {
    const isSelected = selectedProduct && selectedProduct.id === item.id;
    
    // Classes base
    let baseClass = "";
    
    if (typeof rowClassName === 'function') {
      baseClass = rowClassName(item, index);
    } else {
      baseClass = rowClassName;
    }

    // Adiciona classes de seleção
    if (isSelected) {
      return `${baseClass} bg-blue-50 border-l-4 border-l-blue-500`;
    }

    return baseClass;
  };

  // -------------------------
  // PAGINAÇÃO (25 por página)
  // -------------------------
  const ITEMS_PER_PAGE = 25;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [data.length, page, totalPages]);

  const paginatedData = useMemo(() => {
    if (!pagination) return data;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return data.slice(start, end);
  }, [data, page, pagination]);

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
                  <td colSpan={columns.length}>
                    <DataState
                      variant="loading"
                      compact
                      description={loadingMessage}
                    />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length}>
                    <DataState
                      variant={errorVariant}
                      compact
                      description={error}
                      onAction={onRetry}
                    />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2 px-6 py-12">
                      <Inbox className="w-8 h-8 text-gray-400" />
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
                    onClick={() => {
                      if (handleProductClick) {
                        handleProductClick(item as any);
                      }
                      onRowClick?.(item, index);
                    }}
                    onContextMenu={(e) => {
                      if (handleContextMenu) {
                        handleContextMenu(e, item as any);
                      }
                    }}
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
      {pagination && data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Anterior
          </button>

          <span className="text-sm font-medium text-gray-700">
            Página {page} de {totalPages} • {data.length} itens
          </span>

          <button
            onClick={nextPage}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
