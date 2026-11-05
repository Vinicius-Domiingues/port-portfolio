// Contas inteiramente ilustrativas, independentes das contas do banco.
(() => {
    document.body.classList.add('demo-admin');
    const icons = {
        pessoas:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0114 0v3M16 4a3 3 0 010 6M18 14a6 6 0 014 5v2"/>',
        usuario:'<circle cx="12" cy="7" r="4"/><path d="M5 21v-3a7 7 0 0114 0v3"/>',
        escudo:'<path d="M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7Z M9 12l2 2 4-4"/>',
        inicio:'<path d="M3 10l9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
        trofeu:'<path d="M8 3h8v6a4 4 0 01-8 0ZM8 5H4v3a4 4 0 004 4M16 5h4v3a4 4 0 01-4 4M12 13v5M8 21h8M10 18h4v3"/>',
        menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
        busca:'<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
        filtro:'<path d="M3 5h18l-7 8v7l-4-2v-5Z"/>',
        atualizar:'<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0114 6M18 18A8 8 0 014 12"/>',
        info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
        cadeado:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 018 0v4M12 14v3"/>'
    };
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
    const users = Array.from({length:6}, (_,i) => ({name:`Usuário Demo ${String(i+1).padStart(2,'0')}`, email:`usuario${i+1}@example.test`, admin:i<2, date:`${String(4+i*3).padStart(2,'0')}/10/2026`, initials:`D${i+1}`}));
    const notice = 'Alteração desativada nesta demonstração de consulta.';
    document.querySelector('.cabecalho-acoes').innerHTML = '<button id="novoUsuario" class="primario" disabled title="'+notice+'">＋ Novo usuário</button><a class="demo-voltar" href="index.html">← Início</a>';
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
    document.querySelector('.titulo p').textContent = 'Contas, permissões e níveis de acesso do Port';
    document.getElementById('qtdContas').textContent = '6';
    document.getElementById('qtdAdmins').textContent = '2';
    document.getElementById('qtdComuns').textContent = '4';
    document.getElementById('contasMes').textContent = 'Contas fictícias';
    document.getElementById('percentualAdmins').textContent = '33% do total';
    document.getElementById('percentualComuns').textContent = '67% do total';
    document.querySelector('#tituloOrientacoes + div article:last-child p').textContent = 'No sistema completo, o administrador pode conceder acesso às contas. Nesta vitrine, essa ação está desativada.';
    function render() {
        const query = document.getElementById('buscaUsuarios').value.toLowerCase();
        const role = document.getElementById('filtroPermissao').value;
        const filtered = users.filter(u => (u.name+' '+u.email).toLowerCase().includes(query) && (!role || (u.admin ? 'organizador':'produtor')===role));
        document.getElementById('listaUsuarios').innerHTML = filtered.map(u=>`<tr><td><div class="nome-celula"><span class="avatar ${u.admin?'demo-avatar-admin':''}" aria-hidden="true">${u.initials}</span><span><strong>${u.name}</strong><small class="demo-conta-legenda">Conta demonstrativa</small></span></div></td><td class="email-celula">${u.email}</td><td><span class="badge ${u.admin?'admin':''}">${u.admin?'Administrador':'Usuário'}</span></td><td class="data-celula">${u.date}</td><td><span class="badge ${u.admin?'ativo':'demo-acesso-selos'}">${u.admin?'Painel completo':'Solicitação de selos'}</span></td><td>${u.admin?`<span class="demo-permissao"><i>${icon('escudo')}</i>Acesso concedido</span>`:`<button class="promover" disabled title="${notice}"><i>${icon('cadeado')}</i>Tornar administrador</button>`}</td></tr>`).join('');
        document.getElementById('totalUsuarios').textContent = `${filtered.length} contas · nomes, e-mails e datas fictícios`;
        document.getElementById('contagemPagina').textContent = `${filtered.length} de 6 contas`;
        document.getElementById('listaVazia').hidden = !!filtered.length;
    }
    document.getElementById('buscaUsuarios').oninput = render;
    document.getElementById('filtroPermissao').onchange = render;
    document.getElementById('abrirFiltros').onclick = event => {
        const filters = document.getElementById('filtrosUsuarios'); filters.hidden = !filters.hidden;
        event.currentTarget.setAttribute('aria-expanded', !filters.hidden);
    };
    document.getElementById('limparFiltros').onclick = () => { document.getElementById('filtroPermissao').value = ''; render(); };
    document.getElementById('atualizarUsuarios').onclick = render;
    for (const id of ['paginaAnterior','proximaPagina']) document.getElementById(id).disabled = true;
    document.getElementById('alternarSidebarUsuarios').onclick = () => {
        const collapsed = document.body.classList.toggle('menu-recolhido');
        document.getElementById('alternarSidebarUsuarios').setAttribute('aria-expanded', matchMedia('(max-width:760px)').matches ? collapsed : !collapsed);
    };
    render();
})();
