import { apiRequest } from "../../api";

export const updateDataCompany = async (companyId: any, payload: any): Promise<void> => {
  const tkn = localStorage.getItem("token");
  
  if (!tkn) {
    throw new Error("Nenhum token fornecido");
  }

  try {
    console.log("🚀 ENVIANDO PATCH - Payload:", payload);

    // ✅ VERIFICA SE TEM IMAGEM PARA UPLOAD
    const hasImage = payload.icon instanceof File || payload.logo instanceof File;
    
    let response;

    if (hasImage) {
      // ✅ ENVIA COMO FORM DATA (com imagem)
      console.log("📸 Detectado arquivo de imagem - enviando como FormData");
      
      const formData = new FormData();
      
      // Adiciona todos os campos ao FormData
      Object.keys(payload).forEach(key => {
        if (payload[key] instanceof File) {
          formData.append('logo', payload[key]); // campo 'logo' para o multer
        } else if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });

      response = await fetch(`http://localhost:3010/admin/companie/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tkn}`,
          // ❌ NÃO incluir 'Content-Type' - o browser define automaticamente com boundary
        },
        body: formData,
      });

    } else {
      // ✅ ENVIA COMO JSON (comportamento normal)
      console.log("📄 Sem arquivos - enviando como JSON");
      response = await apiRequest(
        `admin/companie/${companyId}`,
        "PATCH",
        payload,
        tkn
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("✅ RESPOSTA RECEBIDA:", result);
    return result;

  } catch (err) {
    console.error("❌ ERRO NO SERVICE:", err);
    throw err;
  }
};