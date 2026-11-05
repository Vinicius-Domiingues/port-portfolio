/* Distribuição em blocos e consulta completa de cultivares. Nenhuma amostra é alterada. */
const nuvemCultivares = { entradas: [], total: 0, limparPainel: null, limparModal: null };
const percentualCultivar = quantidade => (nuvemCultivares.total ? quantidade / nuvemCultivares.total * 100 : 0)
    .toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

function contarCultivares(dados) {
    const grupos = new Map();
    dados.forEach(amostra => {
        const original = String(amostra.cultivar ?? '');
        // Somente nomes exatamente iguais são agrupados; ausências são identificadas separadamente.
        const chave = original.trim() ? original : null;
        if (!grupos.has(chave)) grupos.set(chave, {
            nome: chave === null ? 'Cultivar não informada' : original,
            filtro: chave,
            quantidade: 0
        });
        grupos.get(chave).quantidade++;
    });
    return [...grupos.values()].sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function filtrarCultivarDaNuvem(entrada) {
    const select = document.getElementById('filtroCultivar');
    if (entrada.filtro === null || ![...select.options].some(opcao => opcao.value === entrada.filtro)) return;
    document.getElementById('modalCultivares').close();
    select.value = select.value === entrada.filtro ? '' : entrada.filtro;
    filtrarTabelaEGraficos();
}
function botaoCultivar(entrada) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = entrada.nome;
    botao.disabled = entrada.filtro === null || ![...document.getElementById('filtroCultivar').options].some(opcao => opcao.value === entrada.filtro);
    botao.title = entrada.nome + ': ' + entrada.quantidade + ' amostra(s), ' + percentualCultivar(entrada.quantidade);
    botao.setAttribute('aria-label', botao.title + (botao.disabled ? '' : '. Filtrar por cultivar.'));
    botao.addEventListener('click', () => filtrarCultivarDaNuvem(entrada));
    return botao;
}
function preencherListaCultivares(tbody) {
    tbody.replaceChildren();
    nuvemCultivares.entradas.forEach(entrada => {
        const linha = document.createElement('tr');
        const nome = document.createElement('th');
        nome.scope = 'row';
        nome.append(botaoCultivar(entrada));
        const quantidade = document.createElement('td');
        quantidade.textContent = entrada.quantidade.toLocaleString('pt-BR');
        const percentual = document.createElement('td');
        percentual.textContent = percentualCultivar(entrada.quantidade);
        linha.append(nome, quantidade, percentual);
        tbody.append(linha);
    });
    if (!nuvemCultivares.entradas.length) {
        const linha = tbody.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 3;
        celula.textContent = 'Nenhuma cultivar para os filtros selecionados.';
    }
}

/* Blocos ordenados por frequência. O espaço mínimo preserva a leitura dos nomes. */
function observarNuvemCultivares(area, cobertura) {
    area.replaceChildren();
    const todas = nuvemCultivares.entradas;
    const entradas = todas.slice(0, 5);
    if (todas.length > 5) entradas.push({nome: 'Demais cultivares', quantidade: todas.slice(5).reduce((s, e) => s + e.quantidade, 0), agregado: true});
    if (!entradas.length) {
        const vazio = document.createElement('p');
        vazio.className = 'cultivar-vazio';
        vazio.textContent = 'Nenhuma cultivar para os filtros selecionados.';
        area.append(vazio);
    }
    for (let i = 0; i < entradas.length; i += 2) {
        const par = entradas.slice(i, i + 2);
        const linha = document.createElement('div');
        linha.className = 'cultivar-blocos-linha';
        par.forEach((entrada, indice) => {
            const bloco = entrada.agregado ? document.createElement('button') : botaoCultivar(entrada);
            if (entrada.agregado) {
                bloco.type = 'button';
                bloco.addEventListener('click', abrirModalCultivares);
                bloco.setAttribute('aria-haspopup', 'dialog');
                bloco.setAttribute('aria-label', `Ver as demais ${todas.length - 5} cultivares: ${entrada.quantidade} amostras, ${percentualCultivar(entrada.quantidade)}`);
            }
            bloco.className = 'cultivar-bloco';
            bloco.dataset.cor = entrada.agregado ? 'demais' : i + indice;
            bloco.style.flexGrow = 1;
            if (!entrada.agregado) bloco.setAttribute('aria-pressed', String(document.getElementById('filtroCultivar').value === entrada.filtro));
            const nome = document.createElement('span');
            nome.className = 'cultivar-bloco-nome';
            nome.textContent = entrada.nome;
            const valor = document.createElement('span');
            valor.className = 'cultivar-bloco-valor';
            const quantidade = document.createElement('strong');
            quantidade.textContent = entrada.quantidade.toLocaleString('pt-BR');
            const percentual = document.createElement('span');
            percentual.textContent = ' (' + percentualCultivar(entrada.quantidade) + ')';
            valor.append(quantidade, percentual);
            bloco.replaceChildren(nome, valor);
            if (entrada.agregado) {
                const detalhes = document.createElement('span');
                detalhes.className = 'cultivar-ver-detalhes';
                detalhes.textContent = 'Ver detalhes →';
                bloco.append(detalhes);
            }
            const trilho = document.createElement('span');
            trilho.className = 'cultivar-participacao';
            trilho.setAttribute('aria-hidden', 'true');
            trilho.style.setProperty('--participacao', (100 * entrada.quantidade / nuvemCultivares.total) + '%');
            bloco.append(trilho);
            linha.append(bloco);
        });
        area.append(linha);
    }
    const informadas = todas.filter(entrada => entrada.filtro !== null);
    const lideres = informadas.filter(entrada => entrada.quantidade === informadas[0]?.quantidade);
    cobertura.className = 'cultivar-cobertura cultivar-lider';
    const icone = document.createElement('span');
    icone.className = 'cultivar-trofeu';
    icone.setAttribute('aria-hidden', 'true');
    icone.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 3C12 4 4 6 4 13a6 6 0 0 0 6 6c7 0 9-8 10-16ZM3 21l12-12"/></svg>';
    const mensagem = document.createElement('span');
    mensagem.textContent = lideres.length > 1
        ? `Empate: ${lideres.length} cultivares com ${lideres[0].quantidade} amostra(s) cada.`
        : lideres.length ? `${lideres[0].nome} lidera com ${lideres[0].quantidade} ${lideres[0].quantidade === 1 ? 'amostra' : 'amostras'} · ${percentualCultivar(lideres[0].quantidade)} do total.` : 'Nenhuma cultivar informada.';
    cobertura.replaceChildren(icone, mensagem);
    cobertura.hidden = !entradas.length;
    return () => {};
}
function renderizarNuvemCultivares(dados) {
    nuvemCultivares.limparPainel?.();
    nuvemCultivares.entradas = contarCultivares(dados);
    nuvemCultivares.total = dados.length;
    const container = document.getElementById('cultivarCloudContainer');
    container.replaceChildren();
    container.parentElement.querySelector('.cultivar-detalhes')?.remove();
    container.parentElement.querySelector('.cultivar-cobertura')?.remove();
    const resumo = document.getElementById('cultivarPredominante');
    resumo.textContent = dados.length === 1 ? 'Participação em 1 amostra' : `Participação nas ${dados.length} amostras`;
    const area = document.createElement('div');
    area.className = 'cultivar-blocos';
    area.setAttribute('role', 'group');
    area.setAttribute('aria-label', 'Cultivares por frequência. Selecione um nome para filtrar.');
    container.append(area);
    const cobertura = document.createElement('p');
    cobertura.className = 'cultivar-cobertura';
    cobertura.setAttribute('aria-live', 'polite');
    container.after(cobertura);
    nuvemCultivares.limparPainel = observarNuvemCultivares(area, cobertura);
    if (document.getElementById('modalCultivares').open) atualizarModalCultivares();
}
function atualizarModalCultivares() {
    nuvemCultivares.limparModal?.();
    const distintas = nuvemCultivares.entradas.length;
    document.getElementById('resumoModalCultivares').textContent = distintas + ' nomes · ' + nuvemCultivares.total + ' amostras filtradas. Sem agrupamento de grafias diferentes.';
    preencherListaCultivares(document.getElementById('cultivarListaExpandida'));
    const area = document.getElementById('cultivarNuvemExpandida');
    area.replaceChildren();
    const maximo = nuvemCultivares.entradas[0]?.quantidade || 1;
    nuvemCultivares.entradas.forEach((entrada, indice) => {
        const linha = botaoCultivar(entrada);
        linha.className = 'cultivar-ranking-linha';
        const nome = document.createElement('span');
        nome.className = 'cultivar-ranking-nome';
        nome.textContent = entrada.nome;
        const trilho = document.createElement('span');
        trilho.className = 'cultivar-ranking-trilho';
        trilho.setAttribute('aria-hidden', 'true');
        const barra = document.createElement('span');
        barra.style.width = `${entrada.quantidade / maximo * 100}%`;
        barra.style.background = ['#754524', '#426441', '#bd883e', '#a88e70'][indice % 4];
        trilho.append(barra);
        const valor = document.createElement('span');
        valor.className = 'cultivar-ranking-valor';
        valor.textContent = `${entrada.quantidade} (${percentualCultivar(entrada.quantidade)})`;
        linha.replaceChildren(nome, trilho, valor);
        area.append(linha);
    });
    if (!nuvemCultivares.entradas.length) area.textContent = 'Nenhuma cultivar para os filtros selecionados.';
    document.getElementById('cultivarCoberturaExpandida').textContent = 'Quantidade de amostras por cultivar. Selecione um nome para filtrar.';
}
function abrirModalCultivares() {
    const modal = document.getElementById('modalCultivares');
    if (!modal.open) modal.showModal();
    atualizarModalCultivares();
}
document.getElementById('modalCultivares').addEventListener('close', () => {
    nuvemCultivares.limparModal?.();
    nuvemCultivares.limparModal = null;
});
