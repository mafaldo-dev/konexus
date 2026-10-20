import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";
import Swal from "sweetalert2";
import { loginAdmin } from "../services/authService";
import { saveSystemAdminSession } from "../services/systemAdminService";
import { version } from "../version";

// Versão atual do aplicativo
const CURRENT_VERSION = version || "1.2.0";
const GITHUB_API = "https://api.github.com/repos/mafaldo-dev/konexus/releases/latest";

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
        text: "Baixando nova versão em segundo plano...",
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
              <h3>Baixando atualização</h3>
              <p>O download está ocorrendo em segundo plano.</p>
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
        text: "A atualização será aplicada após o reinício do aplicativo.",
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

    ipcRenderer.on("update_error", (_: any, error: any) => {
      console.error("❌ Erro na atualização:", error);
      setDownloading(false);
      Swal.fire({
        title: "Erro na atualização",
        text: "Não foi possível baixar a atualização automaticamente. Tente novamente mais tarde.",
        icon: "error",
        confirmButtonText: "OK",
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

  return { downloading, progress, setDownloading, setProgress };
}

/**
 * Verifica se há uma nova versão disponível no GitHub.
 * Retorna a tag da release mais recente ou null se não houver.
 */
async function checkForUpdate(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(GITHUB_API, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "konexus-update-check",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    const latestTag = data.tag_name;

    if (!latestTag) return null;

    // Remove prefixo 'v' se existir para comparar
    const cleanLatest = latestTag.replace(/^v/, "");
    const cleanCurrent = CURRENT_VERSION.replace(/^v/, "");

    if (cleanLatest !== cleanCurrent) {
      return latestTag;
    }

    return null;
  } catch {
    return null;
  }
}

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [updateChecking, setUpdateChecking] = useState(false);
  const { loading, error, handleLogin } = useAuthService();
  const navigate = useNavigate();


  const { downloading, progress, setDownloading, setProgress } = useAutoUpdater();

  // Verifica atualização ao carregar a tela de login
  useEffect(() => {
    const check = async () => {
      setUpdateChecking(true);
      try {
        const latest = await checkForUpdate();
        if (latest) {
          setUpdateAvailable(latest);
        }
      } finally {
        setUpdateChecking(false);
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const response = await loginAdmin(credentials.user, credentials.pass);

      if (response.ok && response.data?.user && response.data?.token) {
        saveSystemAdminSession(response.data.token, {
          id: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role,
          userType: response.data.user.userType,
        });
        setShowAdminLogin(false);
        Swal.fire({
          title: "Acesso autorizado",
          text: "Bem-vindo ao painel administrativo global.",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
        navigate("/system-admin");
      } else {
        Swal.fire("Erro", "Credenciais inválidas!", "error");
      }
    } catch (err: any) {
      Swal.fire("Erro", err.message || "Erro ao realizar login!", "error");
    }
  };

  // Inicia o download da atualização via Electron (em segundo plano)
  const handleDownloadUpdate = () => {
    setDownloading(true);
    setProgress(0);

    const isElectron = typeof (window as any).require !== 'undefined';
    if (isElectron) {
      const { ipcRenderer } = (window as any).require("electron");
      // Solicita ao main process que inicie o download da atualização
      ipcRenderer.send("download_update");
    }
  };

  // Se há atualização disponível, mostra modal para download automático
  if (updateAvailable) {
    return (
      <section className="flex h-screen w-full bg-gray-50">
        <Branding />
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500 rounded-full p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Nova versão disponível</h2>
            <p className="text-blue-800 mb-4 text-sm">
              Uma nova versão do Konexus está disponível: <strong>{updateAvailable}</strong><br/>
              Sua versão atual: <strong>v{CURRENT_VERSION}</strong><br/><br/>
              O download será iniciado automaticamente em segundo plano.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUpdateAvailable(null);
                  setUpdateChecking(false);
                }}
                className="px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition"
              >
                Ignorar por enquanto
              </button>
              <button
                onClick={handleDownloadUpdate}
                disabled={downloading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? "Baixando..." : "Baixar Atualização"}
              </button>
            </div>
          </div>
          {updateChecking && (
            <div className="mt-4 text-sm text-gray-500">Verificando atualizações...</div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-screen w-full">
      <Branding />

      {/* ✅ Indicador de Download */}
      {downloading && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Baixando atualização... {progress}%</span>
          </div>
        </div>
      )}

      {/* Login normal */}
      {!showAdminLogin && (
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
                <span>Baixando atualização... {progress}%</span>
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
    </section>
  );
};

export default LoginPage;
