import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { DynamicTable } from "../../../utils/Table/DynamicTable";
import { listProducts } from "../../../services/productService";
import { Products } from "../../../types";

/**
 * Alertas reais de estoque: somente produtos cujo saldo está abaixo do
 * mínimo cadastrado. Produtos sem mínimo definido não geram alerta.
 */
export default function StockAlerts() {
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await listProducts();
      if (!response.ok || !response.data) {
        setProducts([]);
        setLoadError(response.error || "Não foi possível carregar os alertas de estoque.");
        return;
      }
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar alertas de estoque:", error);
      setProducts([]);
      setLoadError("Não foi possível carregar os alertas de estoque. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const alerts = products.filter((product) => {
    const minimum = Number(product.minimum_stock);
    const stock = Number(product.stock);
    return Number.isFinite(minimum) && minimum > 0 && Number.isFinite(stock) && stock <= minimum;
  });

  const columns = [
    {
      key: "code",
      header: "Código",
      render: (product: Products) => (
        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-medium text-gray-800">
          {product.code || "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Produto",
      render: (product: Products) => (
        <div>
          <p className="font-semibold text-gray-900">{product.name || "—"}</p>
          <p className="text-xs text-gray-500">{product.brand || "Marca não informada"}</p>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Saldo",
      render: (product: Products) => (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          {Number(product.stock) || 0} un
        </span>
      ),
    },
    {
      key: "minimum_stock",
      header: "Estoque mínimo",
      render: (product: Products) => (
        <span className="text-sm text-gray-700">
          {Number(product.minimum_stock) || 0} un
        </span>
      ),
    },
    {
      key: "deficit",
      header: "Reposição sugerida",
      render: (product: Products) => {
        const deficit =
          (Number(product.minimum_stock) || 0) - (Number(product.stock) || 0);
        return (
          <span className="font-semibold text-red-700">
            {deficit > 0 ? `${deficit} un` : "—"}
          </span>
        );
      },
    },
    {
      key: "location",
      header: "Localização",
      render: (product: Products) => (
        <span className="text-sm text-gray-600">{product.location || "—"}</span>
      ),
    },
  ];

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Alertas de Estoque</h1>
                  <p className="mt-1 text-gray-600">
                    Produtos com saldo igual ou abaixo do estoque mínimo.
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/shopping/purchase-order"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-3 font-medium text-white transition-colors hover:bg-slate-900"
            >
              <ShoppingCart className="h-4 w-4" />
              Ir para compras
            </Link>
          </div>

          {!loading && !loadError && alerts.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <span className="font-semibold">{alerts.length}</span>{" "}
              {alerts.length === 1
                ? "produto precisa de reposição."
                : "produtos precisam de reposição."}
            </div>
          )}

          <DynamicTable
            data={alerts}
            columns={columns}
            loading={loading}
            error={loadError}
            onRetry={load}
            width="100%"
            emptyMessage="Não há dados disponíveis."
            emptyDescription="Nenhum produto está abaixo do estoque mínimo cadastrado."
          />
        </div>
      </div>
    </Dashboard>
  );
}
