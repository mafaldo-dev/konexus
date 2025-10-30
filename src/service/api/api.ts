export const apiRequest = async <T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any,
  token?: string
): Promise<T | null> => {
  const url = `https://backend-oi68.onrender.com/${endpoint}`;
  //
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 🔁 CORREÇÃO CRÍTICA: Pega o token do localStorage de forma SÍNCRONA
    const authToken = token || localStorage.getItem('token');
    
    //console.log('🔐 Token encontrado:', authToken ? 'SIM' : 'NÃO'); // 🔁 DEBUG
    
    if (authToken && authToken !== 'null' && authToken !== 'undefined') {
      // 🔁 Remove aspas e espaços extras
      const cleanToken = authToken.replace(/^["']|["']$/g, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
      //console.log('✅ Token enviado no header'); // 🔁 DEBUG
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

    //console.log('📤 Requisição para:', url, { headers, method }); // 🔁 DEBUG

    const response = await fetch(url, options);

    //console.log('📥 Resposta:', response.status, response.statusText); // 🔁 DEBUG

    if (response.status === 403) {
      const errorText = await response.text();
      console.error('❌ 403 - Acesso negado:', errorText);
      
      // Limpa token inválido
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