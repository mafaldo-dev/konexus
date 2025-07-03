import globo from "../../assets/image/iconeGlobo.png";

export default function LoginForm({ handleSubmit, loading, error, setCredentials }: any) {
    return (
        <div className="w-1/2 flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input
                        className="bg-gray-100 p-3 rounded-lg"
                        type="text"
                        placeholder="Usuário"
                        onChange={(e) => setCredentials((prev: any) => ({ ...prev, user: e.target.value }))}
                        required
                    />
                    <input
                        className="bg-gray-100 p-3 rounded-lg"
                        type="password"
                        placeholder="Senha"
                        onChange={(e) => setCredentials((prev: any) => ({ ...prev, pass: e.target.value }))}
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>

                <p className="text-sm text-center mt-4">
                    Esqueceu sua senha?{" "}
                    <span className="text-blue-600 cursor-pointer hover:underline">Clique aqui</span>
                </p>

                <div className="flex items-center justify-between mt-6 text-sm">
                    <span>Suporte?</span>
                    <div className="flex items-center gap-2">
                        <select className="bg-gray-200 p-1 rounded">
                            <option value="pt-br">Português</option>
                            <option value="en">Inglês</option>
                        </select>
                        <img src={globo} alt="logo" className="h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}