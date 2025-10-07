// src/pages/sales/orders/EditOrderPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import OrderForm from "../components/OrderForm"; // Reutilize o mesmo form de criação
import { getOrderForEdit } from "../../../../service/api/Administrador/orders";
import { OrderResponse } from "../../../../service/interfaces";
import Dashboard from "../../../../components/dashboard/Dashboard";
import { motion } from "framer-motion";

export default function EditOrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // No EditOrderPage.tsx, adicione logs no useEffect
    useEffect(() => {
        const loadOrder = async () => {
            try {
                setLoading(true);
                console.log("🔍 [EDIT] Carregando pedido para edição ID:", id);

                const orderData = await getOrderForEdit(id!);
                console.log("✅ [EDIT] Pedido carregado:", orderData);

                if (orderData && orderData.order) {
                    setOrder(orderData.order);
                } else {
                    console.log("❌ [EDIT] Pedido não encontrado ou não pode ser editado");
                    setError("Pedido não encontrado ou não pode ser editado");
                }
            } catch (error: any) {
                console.error("❌ [EDIT] Erro ao carregar pedido:", error);
                setError(error.message || "Erro ao carregar pedido");
            } finally {
                setLoading(false);
                console.log("✅ [EDIT] Loading finalizado");
            }
        };

        if (id) {
            loadOrder();
        } else {
            console.log("❌ [EDIT] ID não encontrado nos parâmetros");
            setError("ID do pedido não especificado");
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <Dashboard>
                <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 font-medium">Carregando pedido...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard>
                <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                            <h2 className="text-xl font-bold text-red-800 mb-2">Erro</h2>
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => navigate("/sales/orders")}
                                className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors"
                            >
                                Voltar para Lista
                            </button>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (!order) {
        return (
            <Dashboard>
                <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
                            <h2 className="text-xl font-bold text-yellow-800 mb-2">Pedido não encontrado</h2>
                            <p className="text-yellow-600 mb-4">O pedido solicitado não existe ou não pode ser editado.</p>
                            <button
                                onClick={() => navigate("/sales/orders")}
                                className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors"
                            >
                                Voltar para Lista
                            </button>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    {/* Cabeçalho */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <button
                                onClick={() => navigate("/sales/orders")}
                                className="flex items-center text-slate-700 hover:text-slate-900 mb-2 font-medium transition-colors"
                            >
                                ← Voltar para Lista
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">Editar Pedido</h1>
                            <p className="text-gray-600 mt-1 font-medium">
                                Editando pedido: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{order.orderNumber}</span>
                            </p>
                        </div>
                        <div className="text-sm text-gray-500">
                            Status: <span className="font-semibold">{order.orderStatus}</span>
                        </div>
                    </div>

                    {/* Formulário de Edição - CORREÇÃO AQUI */}
                    <OrderForm
                        editMode={true}
                        initialData={order}
                        orderId={order.id}
                    />
                </motion.div>
            </div>
        </Dashboard>
    );
}