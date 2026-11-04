/* Resumo, distribuição de cultivares e paginação dos dados já carregados pelo painel. */
const analiseTabela = { dados: [], pagina: 1, tamanho: 10 };
const formatoAnalise = valor => valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function notaValidaAnalise(amostra) {
    const nota = Number(String(amostra.nota_final ?? '').trim().replace(',', '.'));
    return Number.isFinite(nota) && nota > 0 && nota <= 100 ? nota : null;
}
function renderizarResumoAnalise(dados) {
    const avaliadas = dados.filter(a => notaValidaAnalise(a) !== null);
    const produtores = new Set(dados.map(a => a.produtor_id != null
        ? 'id:' + a.produtor_id
        : 'nome:' + String(a.nome_produtor || '').trim().toLocaleLowerCase('pt-BR')
    ).filter(chave => chave !== 'nome:'));
    const melhor = avaliadas.reduce((atual, a) => !atual || notaValidaAnalise(a) > notaValidaAnalise(atual) ? a : atual, null);
    document.getElementById('indicadorAmostras').textContent = dados.length.toLocaleString('pt-BR');
    document.getElementById('detalheAmostras').textContent = avaliadas.length + ' com avaliação sensorial';
    document.getElementById('indicadorProdutores').textContent = produtores.size.toLocaleString('pt-BR');
    document.getElementById('indicadorMedia').textContent = avaliadas.length
        ? formatoAnalise(avaliadas.reduce((soma, a) => soma + notaValidaAnalise(a), 0) / avaliadas.length) : '—';
    document.getElementById('detalheMedia').textContent = avaliadas.length ? 'Pontuação de 0 a 100' : 'Sem notas válidas';
    document.getElementById('indicadorMaiorNota').textContent = melhor ? formatoAnalise(notaValidaAnalise(melhor)) : '—';
    const local = document.getElementById('detalheMaiorNota');
    local.textContent = melhor ? melhor.municipio || 'Município não informado' : 'Sem notas válidas';
    local.title = melhor ? [melhor.nome_produtor, melhor.codigo_amostra].filter(Boolean).join(' · ') : '';
}

function renderizarTabela(dados) {
    analiseTabela.dados = dados;
    analiseTabela.pagina = 1;
    atualizarPaginaAmostras();
}
function atualizarPaginaAmostras() {
    const { dados, tamanho } = analiseTabela;
    const paginas = Math.max(1, Math.ceil(dados.length / tamanho));
    analiseTabela.pagina = Math.max(1, Math.min(analiseTabela.pagina, paginas));
    const inicio = (analiseTabela.pagina - 1) * tamanho;
    renderizarLinhasTabela(dados.slice(inicio, inicio + tamanho));
    document.getElementById('paginacaoResumo').textContent = dados.length
        ? (inicio + 1) + '–' + Math.min(inicio + tamanho, dados.length) + ' de ' + dados.length : '0 de 0';
    document.getElementById('paginaAnterior').disabled = analiseTabela.pagina === 1;
    document.getElementById('paginaSeguinte').disabled = analiseTabela.pagina === paginas;
    document.getElementById('exportarAmostras').disabled = !dados.length;
}
function mudarPaginaAmostras(delta) {
    analiseTabela.pagina += delta;
    atualizarPaginaAmostras();
}
function alterarTamanhoPagina() {
    analiseTabela.tamanho = Number(document.getElementById('amostrasPorPagina').value);
    analiseTabela.pagina = 1;
    atualizarPaginaAmostras();
}
function exportarAmostrasFiltradas() {
    const colunas = [
        ['Código', 'codigo_amostra'], ['Produtor', 'nome_produtor'], ['Propriedade', 'nome_propriedade'],
        ['Município', 'municipio'], ['Cultivar', 'cultivar'], ['Categoria', 'categoria'],
        ['Altitude', 'altitude_media'], ['Perfil sensorial', 'perfil_sensorial'], ['Nota final', 'nota_final']
    ];
    const celula = valor => {
        let texto = String(valor ?? '');
        if (/^[\s]*[=+@-]/.test(texto)) texto = "'" + texto;
        return '"' + texto.replace(/"/g, '""') + '"';
    };
    const linhas = [colunas.map(([titulo]) => titulo), ...analiseTabela.dados.map(a => colunas.map(([, chave]) => a[chave]))];
    const csv = '\uFEFF' + linhas.map(linha => linha.map(celula).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'amostras-filtradas.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
