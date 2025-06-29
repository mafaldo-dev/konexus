import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../AuthContext";

import unauthorized from "../../assets/image/unauthorized.png"


export default function NotFound() {

    const { user } = useAuth()
    const navigate = useNavigate()

    const handleUserAuthorized = () => {
        if(user?.designation === "Vendedor") {
            navigate("/sales/orders")
        } else if (user?.designation === "Conferente") {
            navigate("/sales/order-list")
        } else {
            navigate("/dashboard")
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <AlertCircle className="w-16 h-16 -ml-4 text-red-500 mb-6" />
            <h1 className="text-5xl font-bold text-gray-800 mb-2">
                <img src={unauthorized} alt="Imagem de bloqueio de pagina" />
            </h1>
            <p className="text-xl text-gray-600 mb-6">Usúario não tem permissão</p>
            <button
                onClick={handleUserAuthorized}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
                Voltar para a Home
            </button>
        </div>
    );
}
