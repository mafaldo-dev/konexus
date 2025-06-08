import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

import logo from '../assets/image/iconeGlobo.png'
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [admin, setAdmin] = useState<string>("")
    const [pass, setPassword] = useState<string>("")
    const [error, setError] = useState("")
    const [logged, setLogged] = useState<boolean>(false)

    const navigate = useNavigate();

    async function loginAdmin(username: string, password: string) {
        const adminsRef = collection(db, "Administracao"); // nome da coleção que você criou
        const data = query(adminsRef, where("Admin", "==", username), where("Password", "==", password));

        const querySnapshot = await getDocs(data);

        if (!querySnapshot.empty) {
            return true;
        } else {
            return false;
        }
    }

    async function handleSubmit(e: any) {
        e.preventDefault()
        const success = await loginAdmin(admin, pass)
        if (success) {
            setLogged(true)
            localStorage.setItem("userlogged", admin)
            navigate("/dashboard")
            setError("")
        } else {
            console.error("Verifique suas credenciais de acesso")
            setError("Verifique suas credenciais de acesso!")
        }
    };
    return (
        <section className="flex flex-col mt-72 items-center justify-center p-4">
            <header className="bg-black w-84 h-20 rounded-t-xl flex items-center justify-center ">
                <h2 className="text-white font-bold text-xl">KepplerB</h2>
            </header>
            <div className="flex flex-col bg-gray-200 h-92 w-84">
                <h2 className="text-xl font-bold text-center mt-12">Login</h2>
                <div className="flex flex-col gap-2">
                    <form className="flex flex-col w-62 m-auto mt-4 gap-2" onSubmit={handleSubmit}>
                        <div>
                            <input
                                className="bg-white p-2 rounded-lg w-full"
                                type="text"
                                placeholder="Usuário"
                                autoFocus
                                value={admin}
                                onChange={(e) => setAdmin(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <input
                                className="bg-white p-2 rounded-lg w-full"
                                type="password"
                                placeholder="Senha"
                                value={pass}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button className="bg-black text-white font-bold w-22 rounded-lg p-1 m-auto ml-40" type="submit" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </form>
                </div>
                <div className=" h-8 w-72 flex p-2 items-center justify-between m-auto">
                    <h4>Suport<span>?</span></h4>
                    <div className="flex items-center justify-between">
                        <select>
                            <option value="pt-br">Português</option>
                            <option value="en">Inglês</option>
                        </select>
                        <img className="h-5" src={logo} alt="logo" />
                    </div>
                </div>
                <div className="w-72 text-center m-auto">
                    <p className="text-sm ml-2">Esqueceu sua senha? <span className="text-blue-500">Clique Aqui</span></p>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;
