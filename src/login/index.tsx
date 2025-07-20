import React, { useEffect, useState } from "react";
import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";

function useAutoUpdater() {
    useEffect(() => {
        const { ipcRenderer } = window.require("electron");

        ipcRenderer.on('update_available', () => {
            alert("Nova atualização disponível! Ela está sendo baixada em segundo plano.");
        });

        ipcRenderer.on('update_downloaded', () => {
            const wantsRestart = window.confirm('Atualização baixada! Deseja reiniciar o sistema agora?');
            if (wantsRestart) {
                ipcRenderer.send('restart_app');
            }
        });

        return () => {
            ipcRenderer.removeAllListeners('update_available');
            ipcRenderer.removeAllListeners('update_downloaded');
        };
    }, []);
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
