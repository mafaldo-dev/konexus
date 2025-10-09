import React, { useEffect, useState } from "react";

import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";
import Swal from "sweetalert2";
import AdminSetupModal from "./components/AdminSetupModal";
import { handleLoginAdmin } from "../service/api/login";


function useAutoUpdater() {
    // useEffect(() => {
    //     const { ipcRenderer } = window.require("electron");

    //     ipcRenderer.on('update_available', () => {
    //         Swal.fire("Atualização!","Nova atualização disponivel", "info")
    //     });

    //     ipcRenderer.on('update_downloaded', () => {
    //         Swal.fire("Download finalizado", "Atualização sera aplicada após a confirmação", "info")
    //         const wantsRestart = window.confirm('Confirme para instalar a nova versão');
    //         if (wantsRestart) {
    //             ipcRenderer.send('restart_app');
    //         }
    //     });

    //     return () => {
    //         ipcRenderer.removeAllListeners('update_available');
    //         ipcRenderer.removeAllListeners('update_downloaded');
    //     };
    // }, []);
}

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [showAdminLogin, setShowAdminLogin] = useState(false); // tela secreta login admin do sistema
  const [showAdminSetup, setShowAdminSetup] = useState(false); // modal de criação da empresa
  const { loading, error, handleLogin } = useAuthService();

  // Captura atalho secreto Ctrl + Shift + F1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "F1") {
        e.preventDefault();
        setShowAdminLogin(true); // mostra apenas o login admin do sistema
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Login normal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(credentials.user, credentials.pass);
  };

  // Login secreto do sistema
const handleAdminLg = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!credentials.user || !credentials.pass) {
    Swal.fire("Atenção", "Preencha usuário e senha!", "warning");
    return;
  }

  try {
    // Passa os argumentos separados como esperado
    const response = await handleLoginAdmin(credentials.user, credentials.pass);
    console.log(response)

    if (response.user) {
      Swal.fire("Sucesso", "Login de administrador do sistema realizado!", "success");
      setShowAdminLogin(false);
      setShowAdminSetup(true); // abre o formulário de cadastro de empresa
    } else {
      Swal.fire("Erro", "Credenciais inválidas!", "error");
    }
  } catch (err: any) {
    Swal.fire("Erro", err.message || "Erro ao realizar login!", "error");
  }
};

  return (
    <section className="flex h-screen w-full">
      <Branding />

      {/* Login normal */}
      {!showAdminLogin && !showAdminSetup && (
        <LoginForm
          handleSubmit={handleSubmit}
          loading={loading}
          error={error}
          setCredentials={setCredentials}
        />
      )}

      {/* Tela secreta login admin do sistema */}
      {showAdminLogin && (
        <div className="flex flex-col justify-center items-center w-full h-full bg-gray-100">
          <h2 className="mb-4 text-xl font-bold">Login Administrador do Sistema</h2>
          <form className="flex flex-col gap-2 w-64" onSubmit={handleAdminLg}>
            <input
              placeholder="Usuário"
              value={credentials.user}
              onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              placeholder="Senha"
              type="password"
              value={credentials.pass}
              onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
              className="p-2 border rounded"
            />
            <button
              type="submit"
              className="p-2 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Entrar
            </button>
          </form>
        </div>
      )}

      {/* Modal de configuração da empresa */}
      {showAdminSetup && <AdminSetupModal onClose={() => setShowAdminSetup(false)} />}
    </section>
  );
};
export default LoginPage;
