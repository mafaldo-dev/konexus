import { useEffect, useState } from 'react';
import {
  Employee,
  EmployeeFunction,
  EmployeeDesignation
} from '../../../../service/interfaces';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Employee) => void;
  user: Employee | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (isOpen && user) {
      setFormData({ ...user });
    }
  }, [isOpen, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && formData.id) {
      onSave(formData as Employee);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Função</label>
                <select
                  name="designation"
                  value={formData.role || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      designation: e.target.value as EmployeeFunction
                    }))
                  }
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Selecione...</option>
                  {Object.values(EmployeeFunction).map((func) => (
                    <option key={func} value={func}>
                      {func}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Permissão</label>
                <select
                  name="access"
                  value={formData.access || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      access: e.target.value as EmployeeDesignation
                    }))
                  }
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Selecione...</option>
                  {Object.values(EmployeeDesignation).map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select
                  name="active"
                  value={formData.active === true ? 'true' : formData.active === false ? 'false' : ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      active: e.target.value === 'true'
                    }))
                  }
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Selecione...</option>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-900"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
