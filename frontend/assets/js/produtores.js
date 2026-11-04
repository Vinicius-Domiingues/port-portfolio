// A página usa o mesmo cadastro e perfil de produtores do painel.
const produtoresPagina = { dados: [], selecionado: null, montada: false };
const escaparProdutor = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const textoProdutor = value => {
    const texto = String(value ?? '').trim();
    return !texto || /^(null|undefined|nan)$/i.test(texto) ? 'Não informado' : texto;
};
const termosProdutor = value => String(value || '').split(',').map(s => s.trim()).filter(Boolean);
const normalizarProdutor = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const iniciaisProdutor = nome => String(nome || '?').trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
const temNotaProdutor = p => Number.isFinite(Number(p.media_notas)) && Number(p.media_notas) > 0;
const notaProdutor = p => temNotaProdutor(p) ? Number(p.media_notas).toFixed(2) : 'Não informado';
const iconeProdutor = (nome) => {
    const paths = {
        pessoas: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0112 0v3H3m13-17a3 3 0 010 6m2 4a5 5 0 013 5v2h-3"/>',
        casa: '<path d="M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
        local: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0114 0z"/><circle cx="12" cy="10" r="2"/>',
        cafe: '<path d="M4 5h13v9a5 5 0 01-5 5H9a5 5 0 01-5-5V5zm13 1h2a3 3 0 010 6h-2M3 22h17"/>',
        filtro: '<path d="M3 4h18l-7 8v7l-4 2v-9L3 4z"/>',
        busca: '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
        olho: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        folha: '<path d="M20 3C8 2 3 7 4 14s13 9 16-11zM4 21L16 9"/>',
        email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>',
        telefone: '<path d="M6 3H3v4c0 8 6 14 14 14h4v-4l-5-2-2 2a14 14 0 01-7-7l2-2-3-5z"/>'
    };
    return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[nome] || paths.pessoas}</svg>`;
};

function montarPaginaProdutores() {
    if (produtoresPagina.montada) return;
    const pagina = document.getElementById('paginaProdutores');
    pagina.innerHTML = `
        <form class="prod-toolbar" role="search" aria-label="Filtros de produtores">
            <label class="prod-search">${iconeProdutor('busca')}<input id="prodBusca" type="search" aria-label="Buscar produtores" placeholder="Buscar produtor, propriedade ou município..."></label>
            <select id="prodMunicipio" aria-label="Filtrar por município"><option value="">Todos os municípios</option></select>
            <select id="prodCultivar" aria-label="Filtrar por cultivar"><option value="">Todas as cultivares</option></select>
            <select id="prodNota" aria-label="Filtrar por nota"><option value="">Todas as notas</option><option value="com">Com nota</option><option value="sem">Sem nota</option></select>
            <div class="prod-filter-actions"><button id="prodAplicar" type="submit">${iconeProdutor('filtro')} Filtros</button><button id="prodLimpar" type="button">Limpar filtros</button></div>
        </form>
        <div class="prod-layout">
            <div class="prod-main">
                <div id="prodIndicadores" class="prod-stats" aria-label="Indicadores dos resultados"></div>
                <section class="prod-list">
                    <div class="prod-list-heading"><h2 id="prodTituloLista" tabindex="-1">${iconeProdutor('pessoas')} Todos os produtores</h2><div><label for="prodOrdem">Ordenar por</label><select id="prodOrdem"><option value="nome">Nome (A → Z)</option><option value="amostras">Mais amostras</option><option value="media">Maior média</option></select></div></div>
                    <p id="prodResultados" class="prod-results" aria-live="polite"></p>
                    <div class="prod-table-scroll"><table><thead><tr><th>Produtor</th><th>Município</th><th>Propriedades</th><th>Amostras</th><th>Cultivares</th><th>Média</th><th>Perfil</th></tr></thead><tbody id="prodTabela"></tbody></table></div>
                    <div id="prodEstado" role="status" class="prod-state" hidden></div>
                </section>
            </div>
            <aside id="prodDestaque" class="prod-feature" aria-label="Produtor em destaque"></aside>
        </div>`;
    ['prodBusca', 'prodMunicipio', 'prodCultivar', 'prodNota', 'prodOrdem'].forEach(id => {
        document.getElementById(id).addEventListener(id === 'prodBusca' ? 'input' : 'change', renderizarPaginaProdutores);
    });
    pagina.querySelector('.prod-toolbar').addEventListener('submit', event => {
        event.preventDefault();
        renderizarPaginaProdutores();
        document.getElementById('prodTituloLista').focus({ preventScroll: true });
    });
    document.getElementById('prodLimpar').addEventListener('click', () => {
        ['prodBusca', 'prodMunicipio', 'prodCultivar', 'prodNota'].forEach(id => document.getElementById(id).value = '');
        renderizarPaginaProdutores();
    });
    pagina.addEventListener('click', event => {
        const alvo = event.target.closest('[data-produtor]');
        if (alvo) {
            const produtor = produtoresPagina.dados[Number(alvo.dataset.produtor)];
            if (!produtor) return;
            selecionarProdutorDestaque(produtor);
            if (alvo.dataset.acao === 'perfil') abrirModalPerfilProdutor(produtor.nome_produtor);
        }
        if (event.target.closest('[data-recarregar-produtores]')) carregarProdutores();
    });
    produtoresPagina.montada = true;
}

function alternarPaginaProdutores(aba) {
    fecharModalPerfilProdutor();
    montarPaginaProdutores();
    const aberta = aba === 'produtores';
    document.getElementById('paginaProdutores').hidden = !aberta;
    document.getElementById('paginaAnalise').hidden = aberta;
    document.body.classList.toggle('pagina-produtores-aberta', aberta);
    document.getElementById('acaoCadastroPainel').textContent = aberta ? '+ Novo produtor' : '+ Nova Amostra';
    document.getElementById('acaoCadastroPainel').title = aberta ? 'Cadastre um produtor e sua primeira amostra' : 'Cadastrar amostra';
    document.getElementById('subtituloPainel').textContent = aberta ? 'Gestão dos produtores da Região Vulcânica' : aba === 'selos' ? 'Rastreabilidade e gestão de selos' : 'Análise de Dados do Concurso';
    if (aberta) document.getElementById('nomeConcursoAtivo').textContent = 'Produtores';
    else if (aba === 'selos') document.getElementById('nomeConcursoAtivo').textContent = 'Painel de Selos';
    else document.getElementById('nomeConcursoAtivo').textContent = 'Concursos';
}

function definirEstadoProdutores(estado) {
    montarPaginaProdutores();
    const box = document.getElementById('prodEstado');
    box.hidden = false;
    document.getElementById('prodTabela').innerHTML = '';
    document.getElementById('prodIndicadores').innerHTML = '';
    document.getElementById('prodDestaque').innerHTML = '';
    document.getElementById('prodResultados').textContent = '';
    document.getElementById('paginaProdutores').setAttribute('aria-busy', estado === 'carregando' ? 'true' : 'false');
    box.innerHTML = estado === 'erro' ? '<strong>Não foi possível carregar os produtores.</strong><p>Verifique a conexão e tente novamente.</p><button type="button" data-recarregar-produtores>Tentar novamente</button>' : 'Carregando produtores...';
}

function atualizarPaginaProdutores(dados) {
    montarPaginaProdutores();
    produtoresPagina.dados = dados;
    document.getElementById('paginaProdutores').setAttribute('aria-busy', 'false');
    [['prodMunicipio', 'municipios', 'municípios'], ['prodCultivar', 'cultivares', 'cultivares']].forEach(([id, campo, rotulo]) => {
        const select = document.getElementById(id), anterior = select.value;
        const valores = [...new Set(dados.flatMap(p => termosProdutor(p[campo] || (campo === 'municipios' ? p.municipio : ''))))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        select.innerHTML = `<option value="">${campo === 'municipios' ? 'Todos os' : 'Todas as'} ${rotulo}</option>` + valores.map(v => `<option value="${escaparProdutor(v)}">${escaparProdutor(v)}</option>`).join('');
        if (valores.includes(anterior)) select.value = anterior;
    });
    renderizarPaginaProdutores();
}

function filtrarProdutores(dados, busca, municipio, cultivar, nota, ordem) {
    const termo = normalizarProdutor(busca);
    return dados.filter(p => normalizarProdutor([p.nome_produtor, p.propriedades, p.municipios || p.municipio].join(' ')).includes(termo)
        && (!municipio || termosProdutor(p.municipios || p.municipio).includes(municipio))
        && (!cultivar || termosProdutor(p.cultivares).includes(cultivar))
        && (!nota || (nota === 'com' ? temNotaProdutor(p) : !temNotaProdutor(p))))
        .sort((a, b) => (ordem === 'amostras' ? Number(b.total_amostras) - Number(a.total_amostras) : ordem === 'media' ? Number(b.media_notas || 0) - Number(a.media_notas || 0) : 0) || String(a.nome_produtor).localeCompare(String(b.nome_produtor), 'pt-BR'));
}

function renderizarPaginaProdutores() {
    const filtrados = filtrarProdutores(produtoresPagina.dados, ...['prodBusca', 'prodMunicipio', 'prodCultivar', 'prodNota', 'prodOrdem'].map(id => document.getElementById(id).value));
    const destaque = filtrados.find(p => p.nome_produtor === produtoresPagina.selecionado) || filtrados[0];
    produtoresPagina.selecionado = destaque?.nome_produtor || null;
    const estatisticas = [
        ['pessoas', filtrados.length, 'produtores'],
        ['casa', filtrados.reduce((total, p) => total + Number(p.total_propriedades || 0), 0), 'propriedades'],
        ['local', new Set(filtrados.flatMap(p => termosProdutor(p.municipios || p.municipio))).size, 'municípios'],
        ['cafe', filtrados.reduce((total, p) => total + Number(p.total_amostras || 0), 0), 'amostras']
    ];
    document.getElementById('prodIndicadores').innerHTML = estatisticas.map(([icone, numero, rotulo]) => `<div>${iconeProdutor(icone)}<strong>${numero}</strong><span>${rotulo}</span></div>`).join('');
    document.getElementById('prodResultados').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'produtor encontrado' : 'produtores encontrados'}`;
    const estado = document.getElementById('prodEstado');
    estado.hidden = filtrados.length > 0;
    estado.textContent = produtoresPagina.dados.length ? 'Nenhum produtor encontrado. Experimente outros termos ou limpe os filtros.' : 'Ainda não há produtores cadastrados. Cadastre a primeira amostra em “Novo produtor” para começar.';
    document.getElementById('prodTabela').innerHTML = filtrados.map(p => renderizarLinhaProdutor(p, p === destaque)).join('');
    renderizarDestaqueProdutor(destaque);
}

function renderizarLinhaProdutor(p, selecionado) {
    const index = produtoresPagina.dados.indexOf(p), nome = escaparProdutor(p.nome_produtor);
    return `<tr data-produtor="${index}" class="${selecionado ? 'prod-selected' : ''}">
        <td><button type="button" class="prod-person" data-produtor="${index}" aria-pressed="${selecionado}" title="Selecionar ${nome}"><span class="prod-avatar">${escaparProdutor(iniciaisProdutor(p.nome_produtor))}</span><span><strong>${nome}</strong><small>${escaparProdutor(textoProdutor(p.propriedades))}</small></span></button></td>
        <td>${escaparProdutor(textoProdutor(p.municipios || p.municipio))}</td><td class="prod-numeric">${Number(p.total_propriedades || 0)}</td><td class="prod-numeric">${Number(p.total_amostras || 0)}</td><td>${escaparProdutor(textoProdutor(p.cultivares))}</td>
        <td><span class="prod-score ${temNotaProdutor(p) ? '' : 'prod-no-score'}">${notaProdutor(p)}</span></td><td><button type="button" class="prod-view" data-produtor="${index}" aria-label="Visualizar informações de ${nome}" title="Visualizar no painel lateral">${iconeProdutor('olho')}</button></td></tr>`;
}

function selecionarProdutorDestaque(produtor) {
    produtoresPagina.selecionado = produtor.nome_produtor;
    document.querySelectorAll('#prodTabela tr[data-produtor]').forEach(row => {
        const selecionado = produtoresPagina.dados[Number(row.dataset.produtor)] === produtor;
        row.classList.toggle('prod-selected', selecionado);
        row.querySelector('.prod-person').setAttribute('aria-pressed', String(selecionado));
    });
    // Atualizar apenas o detalhe mantém o foco do teclado na ação selecionada.
    renderizarDestaqueProdutor(produtor);
}

function renderizarDestaqueProdutor(p) {
    const box = document.getElementById('prodDestaque');
    if (!p) { box.innerHTML = '<h2>Produtor em destaque</h2><p>Selecione um produtor na lista para conhecer sua origem e seus registros.</p>'; return; }
    const index = produtoresPagina.dados.indexOf(p);
    box.innerHTML = `<h2>${iconeProdutor('pessoas')} Produtor em destaque</h2>
        <div class="prod-cover" role="img" aria-label="Frutos de café no campo"></div>
        <span class="prod-avatar prod-avatar-feature">${escaparProdutor(iniciaisProdutor(p.nome_produtor))}</span>
        <h3>${escaparProdutor(p.nome_produtor)}</h3><p class="prod-property">${escaparProdutor(textoProdutor(p.propriedades))}</p>
        <p class="prod-location">${iconeProdutor('local')}${escaparProdutor(textoProdutor(p.municipios || p.municipio))}</p>
        <p class="prod-caption">Propriedades, variedades e amostras que contam a história desta origem.</p>
        <div class="prod-feature-stats"><div>${iconeProdutor('casa')}<strong>${Number(p.total_propriedades || 0)}</strong><small>Propriedades</small></div><div>${iconeProdutor('cafe')}<strong>${Number(p.total_amostras || 0)}</strong><small>Amostras</small></div><div>${iconeProdutor('folha')}<strong>${escaparProdutor(textoProdutor(p.cultivares))}</strong><small>Cultivares</small></div><div>${iconeProdutor('pessoas')}<strong>${notaProdutor(p)}</strong><small>Média das notas</small></div></div>
        <h4>Contato</h4><p class="prod-contact"><span class="prod-sr-only">Telefone: </span>${iconeProdutor('telefone')}${escaparProdutor(textoProdutor(p.telefone))}</p><p class="prod-contact"><span class="prod-sr-only">E-mail: </span>${iconeProdutor('email')}${escaparProdutor(textoProdutor(p.email))}</p>
        <button class="prod-primary" data-produtor="${index}" data-acao="perfil">${iconeProdutor('olho')} Ver perfil completo</button>
        <p class="prod-footnote">Propriedades e amostras disponíveis no perfil.</p>`;
}
