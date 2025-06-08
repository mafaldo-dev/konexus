import logo from '../../assets/image/logo1.png'
import { useDataHora } from "../../utils/data-hora"

export default function Dashboard({ children }: any) {
    const username = localStorage.getItem("userlogged");
    const getNowHour = useDataHora();
      
    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-black text-white p-6 fixed h-full">
                <img src={logo} alt="Logo keppler" className="mb-6" />
                <h1 className="text-xl font-bold mb-6">Painel Admin</h1>
                <nav className="flex flex-col gap-4">
                    <a href="/dashboard" className="p-2 hover:bg-gray-700 rounded">Dashboard</a>
                    <a href="/products" className="p-2 hover:bg-gray-700 rounded">Produtos</a>
                    <a href="/customer" className="p-2 hover:bg-gray-700 rounded">Clientes</a>
                    <a href="/suppliers" className="p-2 hover:bg-gray-700 rounded">Fornecedores</a>
                    <a href="/sales" className="p-2 hover:bg-gray-700 rounded">Nota fiscal</a>
                    <a href="/report" className="p-2 hover:bg-gray-700 rounded">Relatorios</a>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-6 overflow-auto">
                {/* Header */}
                <header className="flex justify-between items-center bg-white p-4 shadow rounded-lg mb-6">
                    <h2 className="text-xl font-bold">Bem-vindo(a), de volta {username}!</h2>
                    <div className='flex items-center'>
                        <nav>
                            <ul className='flex gap-4 items-center'>
                                <li className='font-semibold'>Central</li>
                                <li className='font-bold'>{username}</li>
                                <li className='text-blue-400'>{getNowHour}</li>
                                <a href='/' className='bg-cyan-500 text-center text-white p-1 font-bold rounded-lg w-22 font-sans'>Logout</a>
                            </ul>
                        </nav>
                    </div>
                </header>
                {/* Main Body */}
                <section className="main-body">
                    {children}
                </section>
            </div>
        </div>
    );
}
