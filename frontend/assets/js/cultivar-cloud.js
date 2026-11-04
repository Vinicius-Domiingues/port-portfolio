/* Nuvem e consulta completa de cultivares. Nenhuma amostra é alterada. */
const nuvemCultivares = { entradas: [], total: 0, limparPainel: null, limparModal: null };
const percentualCultivar = quantidade => (nuvemCultivares.total ? quantidade / nuvemCultivares.total * 100 : 0)
    .toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';

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

/* Empacotamento por retângulos livres: ocupa toda a área, com rotação de 90°
   somente quando a palavra horizontal não cabe. Cada tentativa usa uma única
   escala de fonte para todas as palavras, preservando a relação de frequências. */
function distribuirCultivares(entradas, largura, altura, medir) {
    if (!entradas.length) return [];
    const margem = 6, espaco = 3;
    const maxQuantidade = entradas[0].quantidade;
    const maxFonte = Math.min(64, Math.max(30, largura / 8));
    const bases = entradas.map(entrada => 12 + (maxFonte - 12) * Math.sqrt(entrada.quantidade / maxQuantidade));
    const menorEscala = Math.min(1, 12 / Math.min(...bases));
    const escalas = [];
    for (let escala = 1; escala > menorEscala; escala *= .88) escalas.push(escala);
    escalas.push(menorEscala);
    let melhor = [];
    for (const escala of escalas) {
        let livres = [{ x: margem, y: margem, w: largura - margem * 2, h: altura - margem * 2 }];
        const resultado = [];
        entradas.forEach((entrada, indice) => {
            const fonte = bases[indice] * escala;
            medir.font = '750 ' + fonte + 'px Arial';
            const textoW = Math.ceil(medir.measureText(entrada.nome).width) + 4;
            const textoH = Math.ceil(fonte * 1.18) + 2;
            let escolhido;
            for (const girar of [false, true]) {
                const w = (girar ? textoH : textoW) + espaco;
                const h = (girar ? textoW : textoH) + espaco;
                for (const livre of livres) {
                    if (w > livre.w || h > livre.h) continue;
                    const pontos = [
                        [livre.x, livre.y], [livre.x + livre.w - w, livre.y],
                        [livre.x, livre.y + livre.h - h], [livre.x + livre.w - w, livre.y + livre.h - h],
                        [livre.x + (livre.w - w) / 2, livre.y + (livre.h - h) / 2]
                    ];
                    for (const [x, y] of pontos) {
                        const distancia = Math.hypot((x + w / 2 - largura / 2) / largura, (y + h / 2 - altura / 2) / altura);
                        const desperdicio = (livre.w * livre.h - w * h) / (largura * altura);
                        const custo = distancia + desperdicio * .08;
                        if (!escolhido || custo < escolhido.custo) escolhido = { x, y, w, h, fonte, girar, textoW, textoH, custo };
                    }
                }
                if (escolhido) break;
            }
            if (!escolhido) return;
            const r = escolhido;
            const novos = [];
            for (const livre of livres) {
                if (r.x >= livre.x + livre.w || r.x + r.w <= livre.x || r.y >= livre.y + livre.h || r.y + r.h <= livre.y) {
                    novos.push(livre); continue;
                }
                if (r.x > livre.x) novos.push({ ...livre, w: r.x - livre.x });
                if (r.x + r.w < livre.x + livre.w) novos.push({ ...livre, x: r.x + r.w, w: livre.x + livre.w - r.x - r.w });
                if (r.y > livre.y) novos.push({ ...livre, h: r.y - livre.y });
                if (r.y + r.h < livre.y + livre.h) novos.push({ ...livre, y: r.y + r.h, h: livre.y + livre.h - r.y - r.h });
            }
            livres = novos.filter((a, i) => a.w > 0 && a.h > 0 && !novos.some((b, j) =>
                i !== j && a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h &&
                (a.x !== b.x || a.y !== b.y || a.w !== b.w || a.h !== b.h || j < i)
            ));
            resultado.push({ ...r, entrada, indice });
        });
        if (resultado.length > melhor.length) melhor = resultado;
        if (resultado.length === entradas.length) return resultado;
    }
    return melhor;
}

function observarNuvemCultivares(area, cobertura, aoDistribuir) {
    const medir = document.createElement('canvas').getContext('2d');
    const cores = ['#12694b', '#58361f', '#a56424', '#795239', '#687754', '#8b432a'];
    let frame = 0, anterior = '';
    const desenhar = () => {
        const largura = Math.floor(area.clientWidth), altura = Math.floor(area.clientHeight);
        if (!largura || !altura) return;
        const posicoes = distribuirCultivares(nuvemCultivares.entradas, largura, altura, medir);
        area.replaceChildren();
        if (!nuvemCultivares.entradas.length) {
            const vazio = document.createElement('p');
            vazio.className = 'cultivar-vazio';
            vazio.textContent = 'Nenhuma cultivar para os filtros selecionados.';
            area.append(vazio);
        }
        posicoes.forEach(posicao => {
            const palavra = botaoCultivar(posicao.entrada);
            palavra.className = 'cultivar-palavra';
            const texto = document.createElement('span');
            texto.textContent = posicao.entrada.nome;
            texto.style.width = posicao.textoW + 'px';
            texto.style.height = posicao.textoH + 'px';
            if (posicao.girar) texto.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
            palavra.replaceChildren(texto);
            Object.assign(palavra.style, {
                left: posicao.x + 'px', top: posicao.y + 'px', width: posicao.w - 3 + 'px', height: posicao.h - 3 + 'px',
                fontSize: posicao.fonte + 'px', color: cores[posicao.indice % cores.length]
            });
            area.append(palavra);
        });
        const total = nuvemCultivares.entradas.length;
        cobertura.textContent = total
            ? posicoes.length + ' de ' + total + ' nomes na nuvem. ' + (posicoes.length < total ? 'Consulte todos na lista completa abaixo.' : 'Tamanho proporcional à frequência nas amostras.')
            : '';
        aoDistribuir?.(posicoes.length < total);
    };
    const observador = new ResizeObserver(() => {
        const tamanho = area.clientWidth + ':' + area.clientHeight;
        if (tamanho === anterior) return;
        anterior = tamanho;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(desenhar);
    });
    observador.observe(area);
    desenhar();
    return () => { observador.disconnect(); cancelAnimationFrame(frame); };
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
    const informadas = nuvemCultivares.entradas.filter(entrada => entrada.filtro !== null);
    const lider = informadas[0];
    resumo.textContent = lider
        ? (informadas.filter(e => e.quantidade === lider.quantidade).length > 1 ? 'Mais frequente (empate): ' : 'Predominante: ') +
          lider.nome + ' · ' + percentualCultivar(lider.quantidade)
        : 'Nenhuma cultivar informada';
    const area = document.createElement('div');
    area.className = 'cultivar-nuvem';
    area.setAttribute('role', 'group');
    area.setAttribute('aria-label', 'Cultivares por frequência. Selecione um nome para filtrar.');
    container.append(area);
    const detalhes = document.createElement('details');
    detalhes.className = 'cultivar-detalhes';
    const titulo = document.createElement('summary');
    titulo.textContent = 'Lista completa · ' + nuvemCultivares.entradas.length + ' nomes';
    const rolagem = document.createElement('div');
    rolagem.className = 'cultivar-tabela-rolagem';
    const tabela = document.createElement('table');
    tabela.className = 'cultivar-tabela';
    tabela.innerHTML = '<thead><tr><th scope="col">Cultivar</th><th scope="col">Amostras</th><th scope="col">Participação</th></tr></thead><tbody></tbody>';
    preencherListaCultivares(tabela.querySelector('tbody'));
    rolagem.append(tabela);
    detalhes.append(titulo, rolagem);
    const cobertura = document.createElement('p');
    cobertura.className = 'cultivar-cobertura';
    cobertura.setAttribute('aria-live', 'polite');
    container.after(cobertura, detalhes);
    nuvemCultivares.limparPainel = observarNuvemCultivares(area, cobertura, faltam => {
        if (faltam) detalhes.open = true;
    });
    if (document.getElementById('modalCultivares').open) atualizarModalCultivares();
}
function atualizarModalCultivares() {
    nuvemCultivares.limparModal?.();
    const distintas = nuvemCultivares.entradas.length;
    document.getElementById('resumoModalCultivares').textContent = distintas + ' nomes · ' + nuvemCultivares.total + ' amostras filtradas. Sem agrupamento de grafias diferentes.';
    preencherListaCultivares(document.getElementById('cultivarListaExpandida'));
    nuvemCultivares.limparModal = observarNuvemCultivares(
        document.getElementById('cultivarNuvemExpandida'), document.getElementById('cultivarCoberturaExpandida')
    );
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
