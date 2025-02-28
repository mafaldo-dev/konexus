import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

import { handleLogin } from "../service/api/api";


import logo from '../assets/image/iconeGlobo.png'

const LoginPage: React.FC = () => {
    const [userData, setUserData] = useState<string | any>();
    const [password, setPassword] = useState<string | any>()

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await handleLogin({username: userData, password: password })
            if(response.admin){
                console.log("login bem sucedido",response)
                navigate('/dashboard')
            } else {
                console.log('Verifique as credenciais.', response)
                navigate('/')
            }
            
        } catch(exe){
            console.error('Erro ao realizar login:', exe)
        } finally {
            setLoading(false)
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
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        
                        <input  
                            className="bg-white p-2 rounded-lg"
                            type="text"
                            placeholder="Usuário"
                            autoFocus
                            value={userData}
                            onChange={(e) =>  setUserData(e.target.value)}
                            required 
                        />
                        <input 
                            className="bg-white p-2 rounded-lg"
                            type="password" 
                            placeholder="Senha" 
                            value={password}
                            onChange={(e) =>  setPassword(e.target.value)}
                            required 
                        />
                        <button className="bg-black text-white font-bold w-22 rounded-lg p-1 m-auto ml-40" type="submit" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
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
