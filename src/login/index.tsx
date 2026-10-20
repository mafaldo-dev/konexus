import React, { useEffect, useRef, useState } from "react";
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

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "not-available" }
  | { status: "available"; version?: string }
  | {
      status: "downloading";
      version?: string;
      percent: number;
      bytesPerSecond?: number;
      transferred?: number;
      total?: number;
    }
  | { status: "downloaded"; version?: string }
  | { status: "error"; message?: string };

// Acompanha o estado real do electron-updater. O processo principal envia
// eventos e também mantém o último estado disponível para quem abrir a tela
// depois do início da verificação.
function useAutoUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: "idle" });
  const updateVersionRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const isElectron = typeof (window as any).require !== "undefined";
    if (!isElectron) return;

    const { ipcRenderer } = (window as any).require("electron");

    const applyStatus = (state: UpdateState) => {
      if (!state || typeof state.status !== "string") return;

      if (
        (state.status === "available" ||
          state.status === "downloading" ||
          state.status === "downloaded") &&
        state.version
      ) {
        updateVersionRef.current = state.version;
      }

      setUpdateState(state);
    };

    const handleAvailable = (_: any, info: any) => {
      updateVersionRef.current = info?.version || updateVersionRef.current;
      setUpdateState({
        status: "available",
        version: updateVersionRef.current,
      });
    };

    const handleProgress = (_: any, progressObj: any) => {
      const percent = Number.isFinite(progressObj?.percent)
        ? Math.round(progressObj.percent)
        : 0;

      setUpdateState({
        status: "downloading",
        version: updateVersionRef.current,
        percent,
        bytesPerSecond: progressObj?.bytesPerSecond,
        transferred: progressObj?.transferred,
        total: progressObj?.total,
      });
    };

    const handleDownloaded = (_: any, info: any) => {
      updateVersionRef.current = info?.version || updateVersionRef.current;
      setUpdateState({
        status: "downloaded",
        version: updateVersionRef.current,
      });
    };

    const handleNotAvailable = () => setUpdateState({ status: "not-available" });
    const handleError = (_: any, message: string) =>
      setUpdateState({ status: "error", message });
    const handleChecking = () => setUpdateState({ status: "checking" });
    const handleStatus = (_: any, state: UpdateState) => applyStatus(state);

    ipcRenderer.on("update_available", handleAvailable);
    ipcRenderer.on("download_progress", handleProgress);
    ipcRenderer.on("update_downloaded", handleDownloaded);
    ipcRenderer.on("update_not_available", handleNotAvailable);
    ipcRenderer.on("update_error", handleError);
    ipcRenderer.on("update_checking", handleChecking);
    ipcRenderer.on("update_status", handleStatus);

    ipcRenderer
      .invoke("get_update_status")
      .then((state: UpdateState) => {
        if (state && state.status !== "idle") applyStatus(state);
      })
      .catch(() => {
        // Versões antigas do processo principal não possuem esse handler.
      });

    return () => {
      ipcRenderer.removeListener("update_available", handleAvailable);
      ipcRenderer.removeListener("download_progress", handleProgress);
      ipcRenderer.removeListener("update_downloaded", handleDownloaded);
      ipcRenderer.removeListener("update_not_available", handleNotAvailable);
      ipcRenderer.removeListener("update_error", handleError);
      ipcRenderer.removeListener("update_checking", handleChecking);
      ipcRenderer.removeListener("update_status", handleStatus);
    };
  }, []);

  return updateState;
}

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [retryingUpdate, setRetryingUpdate] = useState(false);
  const { loading, error, handleLogin } = useAuthService();
  const navigate = useNavigate();
  const updateState = useAutoUpdater();

  useEffect(() => {
    if (updateState.status !== "checking") {
      setRetryingUpdate(false);
    }
  }, [updateState.status]);

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

  const restartForUpdate = () => {
    const isElectron = typeof (window as any).require !== "undefined";
    if (isElectron) {
      const { ipcRenderer } = (window as any).require("electron");
      ipcRenderer.send("restart_app");
    }
  };

  const retryUpdate = () => {
    setRetryingUpdate(true);
    setUpdateDismissed(false);

    const isElectron = typeof (window as any).require !== "undefined";
    if (isElectron) {
      const { ipcRenderer } = (window as any).require("electron");
      ipcRenderer.send("check_for_update");
    }
  };

  const dismissUpdate = () => {
    setRetryingUpdate(false);
    setUpdateDismissed(true);
  };

  const showUpdateScreen =
    !updateDismissed &&
    (updateState.status === "available" ||
      updateState.status === "downloading" ||
      updateState.status === "downloaded" ||
      updateState.status === "error" ||
      (retryingUpdate && updateState.status === "checking"));

  // Se o electron-updater encontrou uma atualização, a tela de login fica
  // bloqueada até o download terminar. O download é iniciado automaticamente
  // pelo processo principal (autoDownload = true).
  if (showUpdateScreen) {
    const percent =
      updateState.status === "downloading"
        ? updateState.percent
        : updateState.status === "downloaded"
          ? 100
          : 0;
    const speed =
      updateState.status === "downloading" && updateState.bytesPerSecond
        ? `${(updateState.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`
        : null;
    const newVersion = "version" in updateState ? updateState.version : undefined;

    return (
      <section className="flex h-screen w-full bg-gray-50">
        <Branding />
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center w-full">
            <div className="flex justify-center mb-4">
              <div
                className={`rounded-full p-3 ${
                  updateState.status === "error" ? "bg-rose-500" : "bg-blue-500"
                }`}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-blue-900 mb-2">
              {updateState.status === "error"
                ? "Não foi possível atualizar"
                : updateState.status === "downloaded"
                  ? "Atualização pronta"
                  : updateState.status === "checking"
                    ? "Verificando atualizações"
                    : "Atualizando o Konexus"}
            </h2>

            <p className="text-blue-800 mb-3 text-sm">
              {updateState.status === "error"
                ? updateState.message || "Ocorreu um erro ao baixar a atualização."
                : updateState.status === "downloaded"
                  ? "O download foi concluído. Reinicie o aplicativo para aplicar a nova versão."
                  : updateState.status === "checking"
                    ? "Aguarde enquanto verificamos a versão mais recente."
                    : "O download está sendo feito automaticamente em segundo plano."}
            </p>

            {newVersion && (
              <p className="text-blue-800 mb-2 text-sm">
                Nova versão: <strong>{newVersion}</strong>
              </p>
            )}

            <p className="text-blue-800 mb-4 text-sm">
              Sua versão atual: <strong>v{CURRENT_VERSION}</strong>
            </p>

            {(updateState.status === "available" ||
              updateState.status === "downloading") && (
              <>
                <div className="w-full bg-blue-100 rounded-full h-4 overflow-hidden mb-2">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-blue-900">{percent}% concluído</p>
                {speed && <p className="text-xs text-blue-700 mt-1">Velocidade: {speed}</p>}
              </>
            )}

            {updateState.status === "checking" && (
              <p className="text-sm text-blue-700">Aguarde...</p>
            )}

            {updateState.status === "downloaded" && (
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={restartForUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Reiniciar agora
                </button>
                <button
                  onClick={dismissUpdate}
                  className="px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition"
                >
                  Mais tarde
                </button>
              </div>
            )}

            {updateState.status === "error" && (
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={retryUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={dismissUpdate}
                  className="px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition"
                >
                  Continuar sem atualizar
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-screen w-full">
      <Branding />

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
