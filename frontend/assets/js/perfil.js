const perfilEstado = { dados: null, pedido: 0, foco: null };
const perfilTexto = value => escaparProdutor(textoProdutor(value));
const perfilNota = value => Number(value) > 0 ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Sem nota';
const perfilIcone = nome => ({ amostra: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 3h8M10 3v7L5 20q0 1 2 1h10q2 0 2-1l-5-10V3M8 15h8"/></svg>', estrela: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>' }[nome] || iconeProdutor(nome));

async function abrirModalPerfilProdutor(nome) {
    const pedido = ++perfilEstado.pedido;
    const pagina = document.getElementById('perfilProdutor');
    if (pagina.hidden) perfilEstado.foco = document.activeElement;
    pagina.hidden = false;
    document.body.classList.add('perfil-aberto');
    pagina.innerHTML = '<button class="perfil-voltar" onclick="fecharModalPerfilProdutor()">← Voltar</button><p role="status">Carregando perfil do produtor…</p>';
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/produtores/${encodeURIComponent(nome)}`);
        if (!response.ok) throw new Error('Não foi possível carregar o perfil.');
        const dados = await response.json();
        if (pedido !== perfilEstado.pedido) return;
        perfilEstado.dados = dados;
        renderizarPerfil();
        document.getElementById('nomeProdutorModal').focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        if (pedido !== perfilEstado.pedido) return;
        pagina.innerHTML = '<button class="perfil-voltar" onclick="fecharModalPerfilProdutor()">← Voltar</button><p role="alert">Não foi possível carregar o perfil. Volte à lista e tente novamente.</p>';
    }
}

function fecharModalPerfilProdutor() {
    ++perfilEstado.pedido;
    const pagina = document.getElementById('perfilProdutor');
    if (!pagina || pagina.hidden) return;
    pagina.hidden = true;
    document.body.classList.remove('perfil-aberto');
    perfilEstado.foco?.focus({ preventScroll: true });
}

function renderizarPerfil() {
    const { produtor: p, amostras } = perfilEstado.dados;
    const propriedades = [...new Set(amostras.map(a => a.nome_propriedade).filter(Boolean))];
    const cultivares = [...new Set(amostras.map(a => a.cultivar).filter(Boolean))];
    const campos = [['Telefone', 'telefone', 'tel'], ['E-mail', 'email', 'email'], ['Associação', 'associacoes', 'associacao'], ['Assistência técnica', 'assistencias', 'assist'], ['Gênero', 'genero', 'genero']];
    document.getElementById('perfilProdutor').innerHTML = `
        <button class="perfil-voltar" onclick="fecharModalPerfilProdutor()">← <span>Produtores</span></button>
        <div class="perfil-capa"><span class="perfil-avatar">${escaparProdutor(iniciaisProdutor(p.nome_produtor))}</span><div class="perfil-identidade"><h1 id="nomeProdutorModal" tabindex="-1">${perfilTexto(p.nome_produtor)}</h1><p>${perfilIcone('local')} <span>${perfilTexto(propriedades.join(', '))} · <span id="municipioProdutorModal">${perfilTexto(p.municipio)}</span></span></p></div><div class="perfil-acoes"><button onclick="editarPerfilProdutor()">✎ Editar produtor</button><details><summary aria-label="Mais ações">•••</summary><div><button onclick="gerarPDFPerfil()">Gerar PDF / Relatório</button><button class="perfil-excluir" onclick="excluirProdutorSelecionado()">Excluir produtor</button></div></details></div></div>
        <div class="perfil-indicadores">${[
            ['casa', propriedades.length, 'propriedades'], ['amostra', amostras.length, 'amostras', 'statsTotalAmostrasModal'], ['estrela', perfilNota(p.media_notas), 'média das notas', 'statsMediaNotasModal'], ['folha', cultivares.join(', ') || 'Não informado', 'cultivares', 'statsVariedadesModal']
        ].map(([icone, valor, legenda, id]) => `<div><span class="perfil-icone ${icone === 'estrela' ? 'verde' : ''}">${perfilIcone(icone)}</span><div><strong ${id ? `id="${id}"` : ''}>${escaparProdutor(valor)}</strong><small>${legenda}</small></div></div>`).join('')}</div>
        <span id="statsPropriedadesModal" hidden>${perfilTexto(propriedades.join(', '))}</span>
        <nav class="perfil-abas" aria-label="Seções do perfil">${[['geral', 'casa', 'Visão geral'], ['propriedades', 'casa', 'Propriedades'], ['amostras', 'amostra', 'Amostras'], ['historico', 'cafe', 'Histórico']].map(([aba, icone, label]) => `<button data-perfil-aba="${aba}" onclick="alternarPerfilAba('${aba}')">${perfilIcone(icone)}${label}</button>`).join('')}</nav>
        <div class="perfil-info" data-perfil-secao="geral"><section class="perfil-card"><h2>${perfilIcone('pessoas')}Dados do produtor</h2><dl>${campos.map(([label, campo, id]) => `<dt>${label}</dt><dd id="${id}ProdutorModal">${perfilTexto(p[campo])}</dd>`).join('')}</dl></section><section class="perfil-card"><h2>${perfilIcone('folha')}Resumo</h2><p>Perfil com ${propriedades.length} propriedade(s) e ${amostras.length} amostra(s) cadastradas${p.municipio ? ` em ${perfilTexto(p.municipio)}` : ''}. Consulte as propriedades, cultivares e avaliações desta origem.</p><div class="perfil-contato"><h3>${perfilIcone('telefone')}Contato</h3><p>${perfilIcone('telefone')}${perfilTexto(p.telefone)}</p><p>${perfilIcone('email')}${perfilTexto(p.email)}</p></div></section></div>
        <section class="perfil-card" data-perfil-secao="propriedades"><h2>${perfilIcone('casa')}Propriedades (${propriedades.length})</h2>${propriedades.map(nome => `<div class="perfil-propriedade"><img src="assets/img/perfil_cover.png" alt=""><div><h3>${perfilTexto(nome)}</h3><p>${perfilIcone('local')}${perfilTexto(p.municipio)}</p></div><div class="perfil-prop-total">${perfilIcone('folha')}<span><strong>${amostras.filter(a => a.nome_propriedade === nome).length}</strong><small>amostras</small></span></div></div>`).join('') || '<p>Nenhuma propriedade informada.</p>'}</section>
        <section class="perfil-card" data-perfil-secao="amostras"><div class="perfil-section-heading"><h2>${perfilIcone('amostra')}<span id="perfilTituloAmostras">Amostras (${amostras.length})</span></h2><button onclick="alternarPerfilAba('amostras')">Ver todas as amostras →</button></div><div class="perfil-tabela"><table><thead><tr><th>Código</th><th>Propriedade</th><th>Categoria / Cultivar</th><th>Pasta / Evento</th><th>Nota</th><th>Ações</th></tr></thead><tbody id="corpoTabelaAmostrasProdutorModal"></tbody></table></div></section>
        <section class="perfil-card" data-perfil-secao="historico" hidden><h2>${perfilIcone('cafe')}Histórico de participação</h2><p>Registros de amostras por pasta e evento.</p><div class="perfil-historico">${[...new Set(amostras.map(a => a.nome_concurso ? `${a.nome_concurso}${a.ano_concurso ? ` (${a.ano_concurso})` : ''}` : 'Sem evento informado'))].map(evento => `<p>${perfilIcone('amostra')}${perfilTexto(evento)}</p>`).join('') || '<p>Nenhum registro encontrado.</p>'}</div></section>
        <dialog id="perfilDialog" class="perfil-dialog"></dialog>`;
    renderizarAmostrasPerfil(amostras);
    alternarPerfilAba('geral');
}

function renderizarAmostrasPerfil(amostras) {
    document.getElementById('corpoTabelaAmostrasProdutorModal').innerHTML = amostras.map(a => `<tr><td>${perfilTexto(a.codigo_amostra)}</td><td>${perfilTexto(a.nome_propriedade)}</td><td>${perfilTexto(a.categoria)}<small>${perfilTexto(a.cultivar)}</small></td><td>${perfilTexto(a.nome_concurso)}${a.ano_concurso ? ` (${perfilTexto(a.ano_concurso)})` : ''}</td><td><span class="prod-score">${perfilNota(a.nota_final)}${Number(a.nota_final) > 0 ? ' pts' : ''}</span></td><td><button data-amostra-perfil="${perfilEstado.dados.amostras.indexOf(a)}">${perfilIcone('olho')}Ver detalhes</button></td></tr>`).join('') || '<tr><td colspan="6">Nenhuma amostra encontrada.</td></tr>';
    document.querySelectorAll('[data-amostra-perfil]').forEach(button => button.addEventListener('click', () => {
        const a = perfilEstado.dados.amostras[Number(button.dataset.amostraPerfil)];
        const dialog = document.getElementById('perfilDialog');
        dialog.innerHTML = `<h2>Detalhes da amostra</h2><dl>${[['Código', a.codigo_amostra], ['Propriedade', a.nome_propriedade], ['Categoria', a.categoria], ['Cultivar', a.cultivar], ['Evento', a.nome_concurso], ['Ano', a.ano_concurso], ['Nota SCA', perfilNota(a.nota_final)]].map(([label, value]) => `<dt>${label}</dt><dd>${perfilTexto(value)}</dd>`).join('')}</dl><form method="dialog"><button>Fechar</button></form>`;
        dialog.showModal();
    }));
}

function alternarPerfilAba(aba) {
    document.querySelectorAll('[data-perfil-aba]').forEach(button => button.setAttribute('aria-current', button.dataset.perfilAba === aba ? 'page' : 'false'));
    document.querySelectorAll('[data-perfil-secao]').forEach(section => { section.hidden = !(section.dataset.perfilSecao === aba || (aba === 'geral' && section.dataset.perfilSecao !== 'historico')); });
    renderizarAmostrasPerfil(perfilEstado.dados.amostras);
    document.getElementById('perfilTituloAmostras').textContent = `Amostras (${perfilEstado.dados.amostras.length})`;
}

function editarPerfilProdutor() {
    const p = perfilEstado.dados.produtor;
    const dialog = document.getElementById('perfilDialog');
    dialog.innerHTML = `<form id="perfilEditar"><h2>Editar produtor</h2>${[['novo_nome', 'Nome', p.nome_produtor], ['telefone', 'Telefone', p.telefone], ['email', 'E-mail', p.email], ['municipio', 'Município', p.municipio], ['genero', 'Gênero', p.genero], ['participa_associacao', 'Associação', p.associacoes], ['assistencia_tecnica', 'Assistência técnica', p.assistencias]].map(([name, label, value]) => `<label>${label}<input name="${name}" value="${escaparProdutor(value || '')}" ${name === 'novo_nome' ? 'required' : ''} type="${name === 'email' ? 'email' : 'text'}"></label>`).join('')}<p role="alert" id="perfilErro"></p><div class="perfil-form-actions"><button type="button" onclick="document.getElementById('perfilDialog').close()">Cancelar</button><button type="submit">Salvar alterações</button></div></form>`;
    dialog.showModal();
    document.getElementById('perfilEditar').addEventListener('submit', async event => {
        event.preventDefault();
        const button = event.submitter;
        const dados = Object.fromEntries(new FormData(event.target));
        dados.novo_nome = dados.novo_nome.trim();
        if (!dados.novo_nome) { document.getElementById('perfilErro').textContent = 'Informe o nome do produtor.'; return; }
        button.disabled = true;
        try {
            const response = await apiFetch(`${API_BASE_URL}/api/produtores/${encodeURIComponent(p.nome_produtor)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
            if (!response.ok) throw new Error('Não foi possível salvar. Tente novamente.');
            dialog.close();
            await abrirModalPerfilProdutor(dados.novo_nome);
            carregarProdutores();
        } catch (error) { document.getElementById('perfilErro').textContent = error.message; }
        finally { button.disabled = false; }
    });
}
