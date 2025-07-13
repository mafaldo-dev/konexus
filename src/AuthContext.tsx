import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserStatus } from "./ChatContext";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export type AccessType = "Full-access" | "Normal";

interface UserInfo {
  id?: string;
  username: string;
  email?: string;
  sector: string;
  access?: AccessType | string;
  designation: string;
  status: UserStatus;
  collection: string
}

interface AuthContextType {
  isAuthenticate: boolean;
  user: UserInfo | null;
  loading: boolean;
  login: (userData: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUsers] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        setUsers(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData: UserInfo) => {
    setUsers(userData);
    localStorage.setItem("userData", JSON.stringify(userData));

    if (!user?.id) return

    const updateUserStatus = user.collection || 'Employee'
    try {
      const userDocRef = doc(db, updateUserStatus, user.id);
      await updateDoc(userDocRef, { status: true });
    } catch (error) {
      console.error(`Erro ao atualizar status do usuário ${user.id} na coleção ${updateUserStatus}:`, error);
      throw new Error("Erro interno do servidor!");
    }
    setUsers(userData)
  };


  const logout = async () => {
    if (!user?.id) return;

    const collectionName = user.collection || 'Employee';

    try {
      const userDocRef = doc(db, collectionName, user.id);
      await updateDoc(userDocRef, { active: false, status: false });
    } catch (error) {
      console.error("Erro ao definir active como false no Firestore:", error);
    }
    setUsers(null);
    localStorage.removeItem("userData");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticate: !!user,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};
