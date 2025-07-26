import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';

import UserFormModal from './components/UserFormModal';
import Dashboard from '../../../components/dashboard/Dashboard';
import { handleAllEmployee, updatedEmployee } from '../../../service/api/Administrador/employee';
import { Employee } from '../../../service/interfaces';
import Swal from 'sweetalert2';

export default function UserManagementPage() {
  const [users, setUsers] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Employee | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await handleAllEmployee();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (user: Employee) => {
    if (!user.id) {
      alert("ID do Colaborador nao encontrado!");
      return;
    }

    try {
      await updatedEmployee(user.id, user);
      Swal.fire("Sucesso...","Informações atualizadas com sucesso!", 'success')
      setIsModalOpen(false);
      fetchUsers(); // Recarrega a lista de usuários
    } catch (Exception) {
      console.error("Erro ao atualizar os dados do colaborador", Exception);
      alert("Erro ao atualizar informações do Colaborador!");
    }
  };

  const handleOpenModal = (user: Employee | null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Dashboard>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Gerenciamento de Usuários</h1>
          <p className="text-sm text-slate-500">Adicione, edite e remova usuários do sistema.</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-500">Carregando...</td>
              </tr>
            ) : (
              users.map(employee => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <UserIcon size={20} className="text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{employee.username}</div>
                        <div className="text-sm text-slate-500">{employee.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{employee.access}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.active === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.active === true ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button onClick={() => handleOpenModal(employee)} className="text-slate-600 hover:text-slate-900 p-1 rounded-full">Editar</button>
                      <button className="ml-2 text-red-600 hover:text-red-900 p-1 rounded-full">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingUser && (
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          user={editingUser}
        />
      )}
    </Dashboard>
  );
}
