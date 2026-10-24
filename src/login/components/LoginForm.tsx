import globo from "../../assets/image/iconeGlobo.png";
import { Link } from 'react-router-dom';

interface LoginFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  setCredentials: React.Dispatch<React.SetStateAction<{ user: string; pass: string }>>;
}

export default function LoginForm({ handleSubmit, loading, error, setCredentials }: LoginFormProps) {
    return (
        <div className="w-1/2 flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input
                        className="bg-gray-100 p-3 rounded-lg"
                        type="text"
                        placeholder="Usuário"
                        autoComplete="username"
                        onChange={(e) => setCredentials(prev => ({ ...prev, user: e.target.value }))}
                        required
                        disabled={loading}
                    />
                    <input
                        className="bg-gray-100 p-3 rounded-lg"
                        type="password"
                        placeholder="Senha"
                        autoComplete="current-password"
                        onChange={(e) => setCredentials(prev => ({ ...prev, pass: e.target.value }))}
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition disabled:bg-gray-400"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
                <Link className="block mt-4 text-sm underline text-center" to="/offline">Recuperar rascunho offline</Link>

                <div className="flex items-center justify-end mt-6 text-sm">
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
