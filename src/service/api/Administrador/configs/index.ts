import { apiRequest } from "../../api";

export const updateDataCompany = async (companyId: any, payload: any): Promise<void> => {
  const tkn = localStorage.getItem("token");
  
  if (!tkn) {
    throw new Error("Nenhum token fornecido");
  }

  try {

    const hasImage = payload.icon instanceof File || payload.logo instanceof File;
    
    if (hasImage) {
      
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

    } else {;
      const response = await apiRequest(
        `admin/companie/${companyId}`,
        "PATCH",
        payload,
        tkn
      );

      return response;
    }

  } catch (err) {
    console.error("❌ ERRO NO SERVICE:", err);
    throw err;
  }
};