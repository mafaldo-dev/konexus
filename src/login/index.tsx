import React, { useState, useEffect } from "react";
import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";
import Swal from "sweetalert2";

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
    useAutoUpdater();

    const [credentials, setCredentials] = useState({ user: "", pass: "" });
    const { loading, error, handleLogin } = useAuthService();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleLogin(credentials);
    };

    return (
        <section className="flex h-screen w-full">
            <Branding />
            <LoginForm
                handleSubmit={handleSubmit}
                loading={loading}
                error={error}
                setCredentials={setCredentials}
            />
        </section>
    );
};

export default LoginPage;
