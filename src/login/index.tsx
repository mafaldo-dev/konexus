import React, { useState } from "react";
import { data, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form'

import { handleLogin } from "../service/api/api";


import logo from '../assets/image/iconeGlobo.png'
import { Login } from "../utils/login";

const LoginPage: React.FC = () => {
    const { register, handleSubmit, formState: {errors} } = useForm<Login>()  
    const [login, setLogin] = useState(false);
    const [loading,setLoading] = useState(false)
    const navigate = useNavigate();

    const onSubmit: SubmitHandler<Login> = async (data) => {     
        try {        
            setLoading(true)
            const response = await handleLogin(data)
            if(response.admin){
                navigate('/dashboard')
                setLogin(true)
            } else {
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
                    <form className="flex flex-col w-62 m-auto mt-4 gap-2" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <input  
                                className="bg-white p-2 rounded-lg w-full"
                                type="text"
                                placeholder="Usuário"
                                autoFocus
                                {...register("username", {required: true})}
                            />  
                            {errors?.username?.type === 'required' && <span className="text-red-500">Digite o username</span>}
                        </div>
                        <div>
                            <input 
                                className="bg-white p-2 rounded-lg w-full"
                                type="password" 
                                placeholder="Senha" 
                                {...register("password", {required: true})}
                            />  
                            {errors?.password?.type === 'required' && <span className="text-red-500">Digite a senha</span>} 
                        </div>
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
