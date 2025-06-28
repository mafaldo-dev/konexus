import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../AuthContext";

import logo from "../assets/image/iconeGlobo.png";

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { user, pass } = credentials;

      // 🔍 Tentativa de login na coleção Employee
      const qEmployee = query(
        collection(db, "Employee"),
        where("username", "==", user),
        where("password", "==", pass)
      );
      const snapshot = await getDocs(qEmployee);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const access = data.access;

        login({
          username: data.username,
          email: data.dataEmployee?.email || "sem-email",
          access,
          designation: data.designation
        });

        if(data.designation === "Vendedor") {
          navigate("/sales/orders")
        } else if(data.designation === "Conferente") {
          navigate("/sales/order-list")
        } else {
          navigate("/dashboard")
        }

        return;
      }

      // 🔍 Tentativa de login na coleção Administracao
      const qAdmin = query(
        collection(db, "Administracao"),
        where("Admin", "==", user),
        where("Password", "==", pass)
      );
      const adminSnapshot = await getDocs(qAdmin);

      if (!adminSnapshot.empty) {
        const data = adminSnapshot.docs[0].data();

        login({
          username: data.Admin,
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

  return (
    <section className="flex flex-col mt-72 items-center justify-center p-4">
      <header className="bg-black w-84 h-20 rounded-t-xl flex items-center justify-center">
        <h2 className="text-white font-bold text-xl">KepplerB</h2>
      </header>

      <div className="flex flex-col bg-gray-200 h-92 w-84">
        <h2 className="text-xl font-bold text-center mt-12">Login</h2>
        <form
          className="flex flex-col w-62 m-auto mt-4 gap-2"
          onSubmit={handleSubmit}
        >
          <input
            className="bg-white p-2 rounded-lg w-full"
            type="text"
            placeholder="Usuário"
            value={credentials.user}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, user: e.target.value }))
            }
            required
          />
          <input
            className="bg-white p-2 rounded-lg w-full"
            type="password"
            placeholder="Senha"
            value={credentials.pass}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, pass: e.target.value }))
            }
            required
          />
          <button
            className="bg-black text-white font-bold w-22 rounded-lg p-1 m-auto ml-40"
            type="submit"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        <div className="h-8 w-72 flex p-2 items-center justify-between m-auto">
          <h4>Suporte<span>?</span></h4>
          <div className="flex items-center justify-between">
            <select>
              <option value="pt-br">Português</option>
              <option value="en">Inglês</option>
            </select>
            <img className="h-5" src={logo} alt="logo" />
          </div>
        </div>

        <div className="w-72 text-center m-auto">
          <p className="text-sm ml-2">
            Esqueceu sua senha?{" "}
            <span className="text-blue-500">Clique Aqui</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
