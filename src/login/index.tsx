import React, { useState } from "react";
import Branding from "./components/Branding";
import LoginForm from "./components/LoginForm";
import useAuthService from "./useAuthService";

const LoginPage: React.FC = () => {
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
