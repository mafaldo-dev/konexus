import { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { db } from "../firebaseConfig";
import { useChat, UserStatus } from "../ChatContext";

// Interface para tipar corretamente os dados retornados do Firestore
interface EmployeeData {
    id: string;
    username: string;
    password?: string;
    access: string;
    designation: string;
    status: boolean
    collection: string
    dataEmployee?: {
        email?: string;
    };
}

export default function useAuthService() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { setUserActive } = useChat();

    const updateUserStatusToActive = async (collectionName: string, userId: string) => {
        try {
            const userDocRef = doc(db, collectionName, userId);
            await updateDoc(userDocRef, { active: true });
        } catch (error) {
            console.error(`Error updating status for user ${userId} in collection ${collectionName}:`, error);
            throw new Error("Erro interno do servidor!")
        }
    };

    const queryUser = async (
        collectionName: string,
        usernameField: string,
        passwordField: string,
        user: string,
        pass: string
    ): Promise<EmployeeData | null> => {
        const q = query(
            collection(db, collectionName),
            where(usernameField, "==", user),
            where(passwordField, "==", pass)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...(docSnap.data() as Omit<EmployeeData, "id">) };
    };


   
    const handleLogin = async (credentials: any) => {
        setLoading(true);
        setError(null);
        setUserActive();

        try {
            const { user, pass } = credentials;

            const employeeData = await queryUser("Employee", "username", "password", user, pass)

            if (employeeData) {
                await updateUserStatusToActive("Employee", employeeData.id);

                login({
                    id: employeeData.id,
                    username: employeeData.username,
                    email: employeeData.dataEmployee?.email || "sem-email",
                    access: employeeData.access,
                    designation: employeeData.designation,
                    sector: employeeData.designation,
                    status: 'Ativo',
                    collection: 'Employee'
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
                await updateUserStatusToActive("Administracao", adminData.id);
                login({
                    id: adminData.id,
                    username: adminData.username,
                    email: "admin@empresa.com",
                    access: "Full-access",
                    designation: "Administrador",
                    sector: "Administrativo",
                    status: 'Ativo',
                    collection: 'Administracao'
                });
                console.log(adminData)
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
