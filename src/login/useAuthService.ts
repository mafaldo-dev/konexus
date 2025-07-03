import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { db } from "../firebaseConfig";

export default function useAuthService() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    const queryUser = async (collectionName: string, usernameField: string, passwordField: string, user: string, pass: string) => {
        const q = query(
            collection(db, collectionName),
            where(usernameField, "==", user),
            where(passwordField, "==", pass)
        );
        const snapshot = await getDocs(q);

        return snapshot.empty ? null : snapshot.docs[0].data();
    };

    const handleLogin = async (credentials: any) => {
        setLoading(true);
        setError(null);

        try {
            const { user, pass } = credentials;

            const employeeData = await queryUser("Employee", "username", "password", user, pass);

            if (employeeData) {
                login({
                    username: employeeData.username,
                    email: employeeData.dataEmployee?.email || "sem-email",
                    access: employeeData.access,
                    designation: employeeData.designation
                });

                if (employeeData.designation === "Vendedor") {
                    navigate("/sales/orders");
                } else if (employeeData.designation === "Conferente") {
                    navigate("/sales/order-list");
                } else {
                    navigate("/dashboard");
                }
                return;
            }

            const adminData = await queryUser("Administracao", "Admin", "Password", user, pass);

            if (adminData) {
                login({
                    username: adminData.Admin,
                    email: "admin@empresa.com",
                    access: "Full-access",
                    designation: "Administrador"
                });
                navigate("/dashboard");
                return;
            }

            setError("Credenciais inválidas.");
        } catch (err) {
            console.error("Erro ao fazer login:", err);
            setError("Erro ao fazer login. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, handleLogin };
}