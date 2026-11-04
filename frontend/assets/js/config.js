// Configuração global da API
// Se estiver rodando localmente (localhost, 127.0.0.1 ou abrindo o arquivo HTML direto com file://), usa o servidor local.
// Em produção, altere a URL de produção para apontar para a API publicada (ex: Heroku, Render, VPS).
const API_BASE_URL = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname === '' || 
                     window.location.protocol === 'file:'
    ? 'http://localhost:3002'
    : 'https://sua-api-producao.com'; // <-- Altere aqui após subir a API para a internet


// Envia credenciais apenas para a API configurada.
async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem('authToken');
    if (token) headers.set('Authorization', 'Bearer ' + token);
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        ['authToken', 'usuarioNome', 'usuarioEmail', 'usuarioRole'].forEach(key => localStorage.removeItem(key));
        location.replace('login.html');
    }
    return response;
}
