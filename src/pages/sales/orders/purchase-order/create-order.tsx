import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

import Dashboard from "../../../../components/dashboard";
import OrderForm from "../components/OrderForm";
import { ArrowLeft } from "lucide-react";

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
                    <div className="text-center">
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Pedido de Venda</h1>
                            <p className="text-gray-600 font-medium">Preencha as informações para criar um novo pedido</p>
                        </motion.div>
                    </div>
                </motion.div>
                <OrderForm />
            </div>
        </Dashboard>
    );
}
