import { useNavigate } from "react-router-dom";

import OrderForm from "../../sales/orders/components/OrderForm";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Dashboard from "../../../components/dashboard/Dashboard";

export default function NewOrderPage() {
    const navigate = useNavigate();

    const handleCancel = () => {
        navigate("/sales/orders");
    };

    return (
        <Dashboard>
            <div className="min-h-screen bg-slate-50 p-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={handleCancel}
                        className="mb-4 flex items-center px-3 py-2 border border-gray-300 rounded hover:bg-slate-100"
                        type="button"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Pedidos
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Novo Pedido de Venda
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Preencha os dados para criar um novo pedido
                        </p>
                    </div>
                </motion.div>
                <OrderForm />
            </div>
        </Dashboard>
    );
}
