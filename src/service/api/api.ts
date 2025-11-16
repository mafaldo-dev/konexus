export const apiRequest = async <T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any,
  token?: string
): Promise<T | null> => {
   // const url = `http://localhost:3010/${endpoint}`;
    const url = `https://backend-oi68.onrender.com/${endpoint}`;
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authToken = token || localStorage.getItem('token');
    
    if (authToken && authToken !== 'null' && authToken !== 'undefined') {

      const cleanToken = authToken.replace(/^["']|["']$/g, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;

    } else {
      console.warn('❌ Token não disponível para envio'); // 🔁 DEBUG
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (response.status === 403) {
      const errorText = await response.text();
      console.error('❌ 403 - Acesso negado:', errorText);

      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      
      throw new Error('Token inválido ou expirado. Faça login novamente.');
    }

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorDetails}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`Erro na API (${endpoint}):`, err);
    throw err;
  }
};

export const apiRequestBlob = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  token?: string
): Promise<Blob | null> => {
  //const url = `http://localhost:3010/${endpoint}`;
  const url = `https://backend-oi68.onrender.com/${endpoint}`;
  
  try {
    const headers: Record<string, string> = {};
    
    const authToken = token || localStorage.getItem('token');
    
    if (authToken && authToken !== 'null' && authToken !== 'undefined') {
      const cleanToken = authToken.replace(/^["']|["']$/g, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      throw new Error('Token inválido ou expirado. Faça login novamente.');
    }
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorDetails}`);
    }
    
    return await response.blob();
  } catch (err) {
    console.warn(`Erro na API (${endpoint}):`, err);
    throw err;
  }
};