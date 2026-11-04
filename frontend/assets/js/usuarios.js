let usuarios = [];
let promocaoPendente = null;
const listaUsuarios = document.getElementById('listaUsuarios');

let paginaUsuarios = 1;
const tamanhoPagina = 8;
const icones = {
 pessoas: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0114 0v3ZM16 4a3 3 0 010 6M18 14a6 6 0 014 5v2"/>',
 usuario: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-3a7 7 0 0114 0v3Z"/>',
 escudo: '<path d="M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7Z"/><path d="M9 12l2 2 4-4"/>',
 inicio: '<path d="M3 10l9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
 trofeu: '<path d="M8 3h8v6a4 4 0 01-8 0ZM8 5H4v3a4 4 0 004 4M16 5h4v3a4 4 0 01-4 4M12 13v5M8 21h8M10 18h4v3"/>',
 menu: '<path d="M5 6h14M5 12h14M5 18h14"/>',
 busca: '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
 filtro: '<path d="M3 5h18l-7 8v7l-4-2v-5Z"/>',
 atualizar: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0114 6M18 18A8 8 0 014 12"/>',
 info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 cadeado: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 018 0v4M12 14v3"/>'
};
function icone(nome) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + icones[nome] + '</svg>'; }
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icone(el.dataset.icon));
function iniciais(nome) { return nome.trim().split(/\s+/).map(n => n[0]).slice(0,2).join('').toUpperCase(); }
function renderizarUsuarios() {
    const busca = document.getElementById('buscaUsuarios').value.trim().toLocaleLowerCase('pt-BR');
    const permissao = document.getElementById('filtroPermissao').value;
    const filtrados = usuarios.filter(u => (u.nome + ' ' + u.email).toLocaleLowerCase('pt-BR').includes(busca) && (!permissao || u.role === permissao));
    const admins = usuarios.filter(u => u.role === 'organizador').length;
    const agora = new Date();
    const recentes = usuarios.filter(u => { const d = new Date(u.criado_em); return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth(); }).length;
    document.getElementById('qtdContas').textContent = usuarios.length;
    document.getElementById('qtdAdmins').textContent = admins;
    document.getElementById('qtdComuns').textContent = usuarios.length - admins;
    document.getElementById('percentualAdmins').textContent = (usuarios.length ? Math.round(admins / usuarios.length * 100) : 0) + '% do total';
    document.getElementById('percentualComuns').textContent = (usuarios.length ? Math.round((usuarios.length-admins) / usuarios.length * 100) : 0) + '% do total';
    document.getElementById('contasMes').textContent = '+' + recentes + ' este mês';
    document.getElementById('totalUsuarios').textContent = filtrados.length + ' contas encontradas';
    paginaUsuarios = Math.min(paginaUsuarios, Math.max(1, Math.ceil(filtrados.length/tamanhoPagina)));
    const inicio = (paginaUsuarios-1)*tamanhoPagina;
    listaUsuarios.replaceChildren();
    for (const usuario of filtrados.slice(inicio, inicio+tamanhoPagina)) {
        const linha = document.createElement('tr');
        const nome = document.createElement('td');
        const pessoa = document.createElement('div'); pessoa.className = 'nome-celula';
        const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = iniciais(usuario.nome);
        const texto = document.createElement('span'); texto.textContent = usuario.nome;
        pessoa.append(avatar,texto); nome.appendChild(pessoa); linha.appendChild(nome);
        const email = document.createElement('td'); email.className = 'email-celula'; email.textContent = usuario.email; linha.appendChild(email);
        const admin = usuario.role === 'organizador';
        const permissaoCelula = document.createElement('td'); const badge = document.createElement('span');
        badge.className = 'badge' + (admin ? ' admin' : ''); badge.textContent = admin ? 'Administrador' : 'Usuário'; permissaoCelula.appendChild(badge); linha.appendChild(permissaoCelula);
        const data = document.createElement('td'); data.className = 'data-celula';
        const criado = usuario.criado_em ? new Date(usuario.criado_em) : null;
        data.textContent = criado && !Number.isNaN(criado.getTime()) ? criado.toLocaleDateString('pt-BR') : '—'; linha.appendChild(data);
        const acesso = document.createElement('td'); const status = document.createElement('span'); status.className = 'badge ativo'; status.textContent = admin ? 'Painel' : 'Selos'; acesso.appendChild(status); linha.appendChild(acesso);
        const acao = document.createElement('td');
        if (!admin) {
            const botao = document.createElement('button'); botao.className = 'promover'; botao.type = 'button';
            botao.innerHTML = '<i>' + icone('escudo') + '</i><span>Tornar administrador</span>';
            botao.setAttribute('aria-label', 'Tornar ' + usuario.nome + ' administrador');
            botao.addEventListener('click', () => {
                promocaoPendente = usuario;
                document.getElementById('textoConfirmacao').textContent = usuario.nome + ' (' + usuario.email + ') terá acesso aos dados internos, ao cadastro de produtores e amostras e à gestão de usuários e administradores.';
                document.getElementById('erroPromocao').textContent = '';
                document.getElementById('confirmacaoAdmin').showModal();
            }); acao.appendChild(botao);
        } else { const marca = document.createElement('span'); marca.className = 'admin-atual'; marca.innerHTML = '<i>' + icone('escudo') + '</i>'; marca.title = 'Já possui acesso administrativo'; marca.setAttribute('aria-label',marca.title); acao.appendChild(marca); }
        linha.appendChild(acao); listaUsuarios.appendChild(linha);
    }
    document.getElementById('listaVazia').hidden = filtrados.length > 0;
    document.getElementById('contagemPagina').textContent = 'Exibindo ' + (filtrados.length ? inicio+1 : 0) + '–' + Math.min(inicio+tamanhoPagina,filtrados.length) + ' de ' + filtrados.length + ' contas';
    document.getElementById('paginaAtual').textContent = paginaUsuarios;
    document.getElementById('paginaAnterior').disabled = paginaUsuarios === 1;
    document.getElementById('proximaPagina').disabled = inicio+tamanhoPagina >= filtrados.length;
}

async function carregarUsuarios() {
    const erroLista = document.getElementById('erroLista');
    erroLista.textContent = '';
    try {
        const resposta = await apiFetch(`${API_BASE_URL}/api/usuarios`);
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || 'Erro ao carregar contas.');
        usuarios = dados;
        renderizarUsuarios();
    } catch (erro) {
        erroLista.textContent = `${erro.message} Use Atualizar para tentar novamente.`;
        document.getElementById('totalUsuarios').textContent = 'Lista indisponível';
    }
}

document.getElementById('confirmarAdmin').addEventListener('click', async evento => {
    if (!promocaoPendente) return;
    const botao = evento.currentTarget;
    botao.disabled = true;
    try {
        const resposta = await apiFetch(`${API_BASE_URL}/api/usuarios/${promocaoPendente.id}/administrador`, { method: 'PATCH' });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || 'Erro ao conceder acesso.');
        document.getElementById('confirmacaoAdmin').close();
        const sucesso = document.getElementById('msgSucesso');
        sucesso.textContent = `${promocaoPendente.nome} agora é administrador.`;
        sucesso.classList.remove('hidden');
        promocaoPendente = null;
        await carregarUsuarios();
    } catch (erro) {
        document.getElementById('erroPromocao').textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
});
function atualizarBusca() { paginaUsuarios = 1; renderizarUsuarios(); }
document.getElementById('buscaUsuarios').addEventListener('input', atualizarBusca);
document.getElementById('filtroPermissao').addEventListener('change', atualizarBusca);
document.getElementById('limparFiltros').addEventListener('click', () => { document.getElementById('filtroPermissao').value = ''; document.getElementById('buscaUsuarios').value = ''; atualizarBusca(); });
document.getElementById('paginaAnterior').addEventListener('click', () => { paginaUsuarios--; renderizarUsuarios(); });
document.getElementById('proximaPagina').addEventListener('click', () => { paginaUsuarios++; renderizarUsuarios(); });
document.getElementById('abrirFiltros').addEventListener('click', evento => { const painel = document.getElementById('filtrosUsuarios'); painel.hidden = !painel.hidden; evento.currentTarget.setAttribute('aria-expanded',String(!painel.hidden)); });
document.getElementById('novoUsuario').addEventListener('click', () => { document.getElementById('msgErro').classList.add('hidden'); document.getElementById('cadastroUsuario').showModal(); });
document.getElementById('alternarSidebarUsuarios').addEventListener('click', evento => { document.body.classList.toggle('menu-recolhido'); const aberto = innerWidth <= 760 ? document.body.classList.contains('menu-recolhido') : !document.body.classList.contains('menu-recolhido'); evento.currentTarget.setAttribute('aria-expanded',String(aberto)); });
function fecharMenuConta() { document.getElementById('menuConta').hidden = true; document.getElementById('abrirMenuConta').setAttribute('aria-expanded','false'); }
document.getElementById('abrirMenuConta').addEventListener('click', evento => { const menu = document.getElementById('menuConta'); menu.hidden = !menu.hidden; evento.currentTarget.setAttribute('aria-expanded',String(!menu.hidden)); });
document.addEventListener('click', evento => { if (!evento.target.closest('.menu-conta')) fecharMenuConta(); });
document.addEventListener('keydown', evento => { if (evento.key === 'Escape') fecharMenuConta(); });
document.getElementById('sairConta').addEventListener('click', () => { ['authToken','usuarioRole','usuarioNome','usuarioEmail','origemCadastro'].forEach(key => localStorage.removeItem(key)); location.replace('login.html'); });
document.getElementById('atualizarUsuarios').addEventListener('click', carregarUsuarios);

(async () => {
    try {
        const resposta = await apiFetch(`${API_BASE_URL}/api/auth/me`);
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || 'Não foi possível verificar seu acesso.');
        localStorage.setItem('usuarioRole', dados.usuario.role);
        if (dados.usuario.role !== 'organizador') {
            location.replace('cadastro.html?origem=selos');
            return;
        }
        document.getElementById('nomeConta').textContent = dados.usuario.nome.split(' ')[0];
        document.getElementById('avatarConta').textContent = iniciais(dados.usuario.nome);
        document.getElementById('nomeCompletoConta').textContent = dados.usuario.nome;
        document.getElementById('emailConta').textContent = dados.usuario.email;
        document.getElementById('alternarSidebarUsuarios').setAttribute('aria-expanded',String(innerWidth > 760));
        document.body.style.visibility = 'visible';
        await carregarUsuarios();
    } catch (erro) {
        document.querySelector('main').replaceChildren();
        const mensagem = document.createElement('p');
        mensagem.textContent = `${erro.message} Recarregue a página para tentar novamente.`;
        mensagem.setAttribute('role', 'alert');
        document.querySelector('main').appendChild(mensagem);
        document.body.style.visibility = 'visible';
    }
})();
