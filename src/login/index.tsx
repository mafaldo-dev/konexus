import React, { useEffect, useState } from "react";

import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";
import Swal from "sweetalert2";
import AdminSetupModal from "./components/AdminSetupModal";
import { handleLoginAdmin } from "../service/api/login";

// ✅ Hook do Auto-Updater funcionando
function useAutoUpdater() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Verifica se está no Electron
    const isElectron = typeof (window as any).require !== 'undefined';
    if (!isElectron) return;

    const { ipcRenderer } = (window as any).require("electron");

    ipcRenderer.on("update_available", () => {
      setDownloading(true);
      setProgress(0);
      
      Swal.fire({
        title: "Atualização disponível!",
        text: "Uma nova versão está sendo baixada...",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          console.info("📥 Iniciando download da atualização...");
        },
      });
    });

    ipcRenderer.on("download_progress", (_: any, progressObj: any) => {
      const percent = Math.round(progressObj.percent);
      setProgress(percent);
      console.info(`📊 Progresso do download: ${percent}%`);

      if (Swal.isVisible() && downloading) {
        Swal.update({
          html: `
            <div style="text-align: center;">
              <h3>Atualizando Sistema</h3>
              <p>Baixando nova versão...</p>
              <div style="width: 300px; background: #e0e0e0; border-radius: 10px; overflow: hidden; height: 20px; margin: 10px auto;">
                <div style="width: ${percent}%; background: #4CAF50; height: 100%; transition: width 0.3s;"></div>
              </div>
              <p style="margin-top: 10px; font-weight: bold;">${percent}% concluído</p>
              <p style="font-size: 12px; color: #666;">Velocidade: ${(progressObj.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s</p>
            </div>
          `
        });
      }
    });

    ipcRenderer.on("update_downloaded", () => {
      console.info("✅ Download da atualização concluído");
      setDownloading(false);
      setProgress(100);
      
      Swal.fire({
        title: "Download concluído!",
        text: "A atualização será aplicada após o reinício.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Reiniciar agora",
        cancelButtonText: "Mais tarde",
        confirmButtonColor: "#4CAF50",
        cancelButtonColor: "#6c757d",
      }).then((result) => {
        if (result.isConfirmed) {
          console.info("🔄 Reiniciando aplicação para instalar atualização...");
          ipcRenderer.send("restart_app");
        }
      });
    });

    ipcRenderer.on("update_not_available", () => {
      console.info("ℹ️ Nenhuma atualização disponível");
    });

    ipcRenderer.on("update_error", (_:any, error: any) => {
      console.error("❌ Erro na atualização:", error);
      setDownloading(false);
      Swal.fire({
        title: "Erro na atualização",
        text: "Não foi possível baixar a atualização.",
        icon: "error",
        confirmButtonText: "OK"
      });
    });

    return () => {
      ipcRenderer.removeAllListeners("update_available");
      ipcRenderer.removeAllListeners("download_progress");
      ipcRenderer.removeAllListeners("update_downloaded");
      ipcRenderer.removeAllListeners("update_not_available");
      ipcRenderer.removeAllListeners("update_error");
    };
  }, [downloading]);

  return { downloading, progress };
}

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [showAdminLogin, setShowAdminLogin] = useState(false); 
  const [showAdminSetup, setShowAdminSetup] = useState(false); 
  const { loading, error, handleLogin } = useAuthService();


  const { downloading, progress } = useAutoUpdater();

  useEffect(() => {
    const isElectron = typeof (window as any).require !== 'undefined';
    
    if (isElectron) {
   
      const { ipcRenderer } = (window as any).require('electron');
      
      const handleF1Shortcut = () => {
        setShowAdminLogin(true);
      };
      
      ipcRenderer.on('global-shortcut-f1', handleF1Shortcut);
      
      return () => {
        ipcRenderer.removeListener('global-shortcut-f1', handleF1Shortcut);
      };
    } else {

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "F1") {
          e.preventDefault();
          setShowAdminLogin(true);
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
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

      {/* ✅ Indicador de Download (opcional - pode remover se preferir apenas o SweetAlert) */}
      {downloading && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Atualizando... {progress}%</span>
          </div>
        </div>
      )}

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
        <div className="flex flex-col justify-center items-center w-full h-full bg-gray-100 relative">
          {/* ✅ Indicador de Download também na tela admin */}
          {downloading && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Atualizando... {progress}%</span>
              </div>
            </div>
          )}
          
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