// A barra lateral exibe uma prévia; a lista completa fica a um clique.
let todasSolicitacoesSelos = false;
let solicitacoesSidebar = [];

function seloPodeSerAprovado(nota) {
    const valor = Number(String(nota ?? '').replace(',', '.'));
    return Number.isFinite(valor) && valor >= 80;
}

function alternarListaSelos() {
    todasSolicitacoesSelos = !todasSolicitacoesSelos;
    renderizarListaSelosSidebar(solicitacoesSidebar);
}

function renderizarListaSelosSidebar(dados) {
    solicitacoesSidebar = Array.isArray(dados) ? dados : [];
    const nav = document.getElementById('listaSelosNav');
    const botao = document.getElementById('seloVerTodas');
    const total = solicitacoesSidebar.length;

    document.getElementById('seloQuantidade').textContent = total;
    botao.hidden = total <= 3;
    botao.setAttribute('aria-expanded', String(todasSolicitacoesSelos));
    document.getElementById('seloVerTodasTexto').textContent = todasSolicitacoesSelos
        ? 'Mostrar menos solicitações'
        : `Ver todas as solicitações (${total})`;

    if (!total) {
        nav.innerHTML = '<p class="selo-vazio">Nenhuma solicitação por aqui ainda. Use o botão + para cadastrar uma amostra.</p>';
        return;
    }

    const visiveis = todasSolicitacoesSelos ? solicitacoesSidebar : solicitacoesSidebar.slice(0, 3);
    const statusClasses = {
        'Pendente': 'pendente',
        'Em análise': 'analise',
        'Em Analise': 'analise',
        'Em Análise': 'analise',
        'Aprovado': 'aprovado',
        'Concluída': 'aprovado',
        'Resolvido': 'aprovado',
        'Rejeitado': 'rejeitado'
    };

    nav.innerHTML = visiveis.map(selo => {
        const nome = selo.nome_produtor || 'Produtor não informado';
        const status = selo.status === 'Concluída' ? 'Aprovado' : selo.status || 'Não informado';
        const classe = statusClasses[status] || 'neutro';

        return `
            <article class="selo-item selo-item-${classe}">
                <button type="button" class="selo-abrir" data-selo-abrir="${escaparProdutor(selo.id)}" aria-label="Ver solicitação de ${escaparProdutor(nome)}" title="${escaparProdutor(nome)}">
                    <span class="selo-avatar" aria-hidden="true">${escaparProdutor(iniciaisProdutor(nome))}</span>
                    <span class="selo-informacoes">
                        <strong>${escaparProdutor(nome)}</strong>
                        <span class="selo-identificador">${escaparProdutor(selo.codigo_amostra || 'Pendente de código')}</span>
                        <span class="selo-municipio">${escaparProdutor(selo.municipio || 'Município não informado')}</span>
                    </span>
                    <span class="selo-situacao selo-situacao-${classe}">${escaparProdutor(status)}</span>
                    <span class="selo-seta" aria-hidden="true">›</span>
                </button>
                <details class="selo-opcoes">
                    <summary aria-label="Ações da solicitação de ${escaparProdutor(nome)}" title="Ações da solicitação">•••</summary>
                    <div>
                        ${status === 'Pendente' && userRole !== 'produtor' ? (seloPodeSerAprovado(selo.nota_final)
                            ? `<button type="button" data-selo-aprovar="${escaparProdutor(selo.id)}">Aprovar selo</button>`
                            : '<span class="selo-aprovacao-aviso">Aprovação disponível após avaliação com nota mínima de 80 pontos.</span>') : ''}
                        <button type="button" data-selo-excluir="${escaparProdutor(selo.id)}">Excluir solicitação</button>
                    </div>
                </details>
            </article>`;
    }).join('');

    nav.querySelectorAll('[data-selo-abrir]').forEach(button => {
        button.addEventListener('click', () => visualizarSelo(Number(button.dataset.seloAbrir)));
    });
    nav.querySelectorAll('[data-selo-aprovar]').forEach(button => {
        button.addEventListener('click', () => marcarSeloComoResolvido(Number(button.dataset.seloAprovar)));
    });
    nav.querySelectorAll('[data-selo-excluir]').forEach(button => {
        button.addEventListener('click', () => excluirSolicitacaoSelo(Number(button.dataset.seloExcluir)));
    });
}
