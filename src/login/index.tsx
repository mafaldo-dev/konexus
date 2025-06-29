import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";

import globo from "../assets/image/iconeGlobo.png";
import logo from "../assets/image/guiman.png";
import { ResetPassword } from "../service/api/login";
import { Employee } from "../service/interfaces/employees";
import { handleAllEmployee } from "../service/api/employee";

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPass, setCurrentPass] = useState<Employee | null>(null);
  const [user, setUser] = useState<Employee[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, pass } = credentials;

      const queryUser = async (collectionName: string, usernameField: string, passwordField: string) => {
        const q = query(
          collection(db, collectionName),
          where(usernameField, "==", user),
          where(passwordField, "==", pass)
        );
        const snapshot = await getDocs(q);
        return snapshot.empty ? null : snapshot.docs[0].data();
      };

      const employeeData = await queryUser("Employee", "username", "password");

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

      const adminData = await queryUser("Administracao", "Admin", "Password");

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
  }

  const handleEdit = (pass: Employee) => {
    setCurrentPass(pass);
    setModalOpen(true);
  };

  const handleResetUserPassword = async () => {
    if (!currentPass?.id) return;
    try {
      await ResetPassword(currentPass.id, {
        ...currentPass,
        updatedAt: new Date()
      });
      const updatedPass = await handleAllEmployee();
      setUser(updatedPass);
      setModalOpen(false);
      alert("Senha atualizada com sucesso!");
    } catch (Exception) {
      console.error("Erro ao realizar a alteração da senha: ", Exception);
      throw new Error("Erro interno do servidor!");
    }
  };

  return (
    <section className="flex h-screen w-full">
      {/* Lado esquerdo - branding */}
      <div className="w-1/2 bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <img src={logo} alt="Logo" className="w-92 h-82 mb-4" />
        <h1 className="text-4xl font-bold text-slate-300">Technology that matters.</h1>
      </div>

      {/* Lado direito - login */}
      <div className="w-1/2 flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              className="bg-gray-100 p-3 rounded-lg"
              type="text"
              placeholder="Usuário"
              value={credentials.user}
              onChange={(e) => setCredentials((prev) => ({ ...prev, user: e.target.value }))}
              required
            />
            <input
              className="bg-gray-100 p-3 rounded-lg"
              type="password"
              placeholder="Senha"
              value={credentials.pass}
              onChange={(e) => setCredentials((prev) => ({ ...prev, pass: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </form>

          <p className="text-sm text-center mt-4">
            Esqueceu sua senha?{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">Clique aqui</span>
          </p>

          <div className="flex items-center justify-between mt-6 text-sm">
            <span>Suporte?</span>
            <div className="flex items-center gap-2">
              <select className="bg-gray-200 p-1 rounded">
                <option value="pt-br">Português</option>
                <option value="en">Inglês</option>
              </select>
              <img src={globo} alt="logo" className="h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
