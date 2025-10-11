import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { CompanyData, createCompanyAdmin } from "../../service/api/adminArea/administrator";

const AdminSetupModal = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [ico, setIco] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!companyName || !adminUsername || !adminPassword) {
      Swal.fire("Atenção", "Preencha todos os campos obrigatórios!", "warning");
      return;
    }

    setIsLoading(true);
    try {
      let logoBase64: string | null = null;
      let icoBase64: string | null = null;

      if (logo) logoBase64 = await fileToBase64(logo);
      if (ico) icoBase64 = await fileToBase64(ico);

      const companyData: CompanyData = {
        companyName,
        adminUsername,
        adminPassword,
        logo: logoBase64,
        ico: icoBase64
      };

      const response = await createCompanyAdmin(companyData);

      if (response?.id) {
        Swal.fire("Sucesso", "Admin e empresa criados com sucesso!", "success");
        onClose();
      } else {
        throw new Error("Erro ao criar admin!");
      }

    } catch (err: any) {
      console.error("Erro completo:", err);
      Swal.fire("Erro", err.message || "Erro ao criar admin!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto"
        onClick={handleModalClick}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Configuração Admin do Sistema</h2>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                placeholder="Digite o nome da empresa"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Admin Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário Admin *
              </label>
              <input
                type="text"
                placeholder="Digite o usuário admin"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Admin Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Admin *
              </label>
              <input
                type="password"
                placeholder="Digite a senha admin"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo da Empresa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setLogo(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
              />
            </div>

            {/* ICO Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone (ICO)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setIco(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button" // ✅ IMPORTANTE: type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit" // ✅ MUDEI PARA type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Admin"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSetupModal;