import React, { useEffect, useState } from "react";

import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";
import Swal from "sweetalert2";
import AdminSetupModal from "./components/AdminSetupModal";
import { handleLoginAdmin } from "../service/api/login";

{/**/}
function useAutoUpdater() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const { ipcRenderer } = window.require("electron");

    ipcRenderer.on("update_available", () => {
      Swal.fire({
        title: "Atualização disponível!",
        text: "Uma nova versão está sendo baixada...",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          setDownloading(true);
        },
      });
    });

    ipcRenderer.on("download_progress", (_: any, progressObj: any) => {
      setProgress(progressObj.percent);

      if (Swal.isVisible() && downloading) {
        Swal.update({
          html: `
            <div style="width:100%;background:#eee;border-radius:10px;overflow:hidden;height:20px;margin-top:10px;">
              <div style="width:${progressObj.percent}%;background:#4CAF50;height:100%;transition:width .3s;"></div>
            </div>
            <p style="margin-top:10px;">Baixando: ${progressObj.percent.toFixed(2)}%</p>
          `,
        });
      }
    });

    ipcRenderer.on("update_downloaded", () => {
      setDownloading(false);
      Swal.fire({
        title: "Download concluído!",
        text: "A atualização será aplicada após o reinício.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Reiniciar agora",
        cancelButtonText: "Mais tarde",
      }).then((result) => {
        if (result.isConfirmed) {
          ipcRenderer.send("restart_app");
        }
      });
    });

    return () => {
      ipcRenderer.removeAllListeners("update_available");
      ipcRenderer.removeAllListeners("download_progress");
      ipcRenderer.removeAllListeners("update_downloaded");
    };
  }, []);
}



const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [showAdminLogin, setShowAdminLogin] = useState(false); 
  const [showAdminSetup, setShowAdminSetup] = useState(false); 
  const { loading, error, handleLogin } = useAuthService();

  useAutoUpdater()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "F1") {
        e.preventDefault();
        setShowAdminLogin(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(credentials.user, credentials.pass);
  };

const handleAdminLg = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!credentials.user || !credentials.pass) {
    Swal.fire("Atenção", "Preencha usuário e senha!", "warning");
    return;
  }

  try {
    const response = await handleLoginAdmin(credentials.user, credentials.pass);

    if (response.user) {
      Swal.fire("Sucesso", "Login de administrador do sistema realizado!", "success");
      setShowAdminLogin(false);
      setShowAdminSetup(true); 
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
