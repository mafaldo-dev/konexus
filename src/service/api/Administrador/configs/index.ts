import { apiRequest } from "../../api";

export const updateDataCompany = async (companyId: any, payload: any): Promise<void> => {
  const tkn = localStorage.getItem("token");
  
  if (!tkn) {
    throw new Error("Nenhum token fornecido");
  }

  try {
    console.log("🚀 ENVIANDO PATCH - Payload:", payload);

    const hasImage = payload.icon instanceof File || payload.logo instanceof File;
    
    if (hasImage) {
      console.log("📸 Detectado arquivo de imagem - enviando como FormData");
      
      const formData = new FormData();
      
      Object.keys(payload).forEach(key => {
        if (payload[key] instanceof File) {
          if (key === 'icon' || key === 'logo') {
            formData.append('logo', payload[key]);
          }
        } else if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });

      // ✅ Endpoints com fallback
      const endpoints = [
        `https://backend-oi68.onrender.com/admin/companie/${companyId}`,
        `http://localhost:3010/admin/companie/${companyId}`
      ];

      for (const url of endpoints) {
        try {
          console.log(`🔄 Tentando endpoint: ${url}`);
          
          // ✅ Adiciona timeout de 10 segundos
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${tkn}`,
            },
            body: formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            console.log("✅ RESPOSTA RECEBIDA (com imagem):", result);
            return result;
          }
          
          // Se não foi bem-sucedido, continua para o próximo
          console.warn(`❌ Endpoint ${url} falhou com status: ${response.status}`);
          
        } catch (err: any) {
          console.warn(`❌ Erro no endpoint ${url}:`, err.message);
          // Continua para o próximo endpoint
        }
      }

      // ✅ Se chegou aqui, todos os endpoints falharam
      throw new Error("Não foi possível conectar com nenhum servidor");

    } else {
      // ✅ Comportamento normal sem imagem
      console.log("📄 Sem arquivos - enviando como JSON");
      const response = await apiRequest(
        `admin/companie/${companyId}`,
        "PATCH",
        payload,
        tkn
      );

      console.log("✅ RESPOSTA RECEBIDA (sem imagem):", response);
      return response;
    }

  } catch (err) {
    console.error("❌ ERRO NO SERVICE:", err);
    throw err;
  }
};