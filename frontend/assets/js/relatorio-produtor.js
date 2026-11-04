// Relatório PDF do produtor, gerado a partir dos dados carregados no perfil.
// Abre uma pré-visualização e só baixa quando o usuário confirmar.
async function gerarPDFPerfil() {
    const dados = perfilEstado.dados;
    if (!dados) return;
    const dialog = abrirPreviewRelatorio();
    const pedido = String(Date.now());
    dialog.dataset.pedido = pedido;
    try {
        const { pdf, nomeArquivo } = await montarPDFProdutor(dados);
        if (!dialog.open || dialog.dataset.pedido !== pedido) return;
        const url = URL.createObjectURL(pdf.output('blob'));
        dialog.dataset.url = url;
        dialog.querySelector('#relatorioPreviewCorpo').innerHTML = `<iframe src="${url}#toolbar=0&navpanes=0&view=FitH" title="Pré-visualização do relatório" style="width: 100%; height: 100%; border: 0; background: #fff;"></iframe>`;
        const baixar = dialog.querySelector('#relatorioPreviewBaixar');
        baixar.disabled = false;
        baixar.onclick = () => pdf.save(nomeArquivo);
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        dialog.querySelector('#relatorioPreviewCorpo').innerHTML = '<p role="alert" style="margin: auto; color: #9f2d20; font-size: 14px;">Não foi possível gerar o relatório. Tente novamente.</p>';
    }
}

function abrirPreviewRelatorio() {
    let dialog = document.getElementById('relatorioPreview');
    if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'relatorioPreview';
        dialog.setAttribute('aria-label', 'Pré-visualização do relatório');
        dialog.style.cssText = 'width: min(900px, 94vw); height: 92vh; max-height: 92vh; padding: 0; border: 0; border-radius: 14px; overflow: hidden; box-shadow: 0 24px 60px rgba(30, 18, 10, .35); font-family: Inter, "Segoe UI", Arial, sans-serif;';
        document.body.appendChild(dialog);
        dialog.addEventListener('close', () => {
            if (dialog.dataset.url) URL.revokeObjectURL(dialog.dataset.url);
            delete dialog.dataset.url;
        });
        dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        const estilo = document.createElement('style');
        estilo.textContent = '#relatorioPreview::backdrop{background:rgba(30,18,10,.55)} #relatorioPreview button{font:inherit;cursor:pointer;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600} #relatorioPreview button:disabled{opacity:.5;cursor:wait}';
        document.head.appendChild(estilo);
    }
    dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <header style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: #3b2418; color: #fff;">
                <h2 style="margin: 0; font-size: 15px; font-weight: 700;">Pré-visualização do relatório</h2>
                <div style="display: flex; gap: 8px;">
                    <button type="button" id="relatorioPreviewFechar" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4);">Fechar</button>
                    <button type="button" id="relatorioPreviewBaixar" disabled style="background: #c48c56; color: #fff; border: 0;">Baixar PDF</button>
                </div>
            </header>
            <div id="relatorioPreviewCorpo" style="flex: 1; display: flex; background: #e9e4de;">
                <p role="status" style="margin: auto; color: #7a6a5e; font-size: 14px;">Gerando pré-visualização…</p>
            </div>
        </div>`;
    dialog.querySelector('#relatorioPreviewFechar').onclick = () => dialog.close();
    if (!dialog.open) dialog.showModal();
    return dialog;
}

async function montarPDFProdutor(dados) {
    const { produtor: p, amostras } = dados;

    const esc = value => escaparProdutor(textoProdutor(value));
    const unicos = lista => [...new Set(lista.map(v => String(v ?? '').trim()).filter(Boolean))];
    const formatarNota = value => Number(value) > 0 ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

    const propriedades = unicos(amostras.map(a => a.nome_propriedade));
    const cultivares = unicos(amostras.map(a => a.cultivar));
    const emissao = new Date().toLocaleDateString('pt-BR');

    const cor = { marrom: '#3b2418', texto: '#2a1d16', suave: '#7a6a5e', bege: '#f6f0e9', linha: '#e8ded3', destaque: '#a0703f', verde: '#2f6b4f', verdeFundo: '#eaf2ec' };
    const rotulo = `font-size: 8px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: ${cor.suave};`;
    const campo = (label, valor) => `<div><div style="${rotulo} margin-bottom: 6px;">${label}</div><div style="font-size: 11.5px; color: ${cor.texto};">${esc(valor)}</div></div>`;
    const tituloSecao = (numero, texto) => `<div style="display: flex; align-items: baseline; gap: 12px; margin: 26px 0 14px;"><span style="font-size: 10px; font-weight: 700; color: ${cor.destaque};">${numero}</span><h2 style="margin: 0; font-size: 14px; font-weight: 700; color: ${cor.texto};">${texto}</h2></div>`;
    const cartao = (label, valor, opcoes = {}) => `<div style="background: ${opcoes.fundo || cor.bege}; border-radius: 10px; padding: 18px 16px; min-height: 88px;"><div style="${rotulo} ${opcoes.corRotulo ? `color: ${opcoes.corRotulo};` : ''}">${label}</div><div style="margin-top: 14px; font-size: ${opcoes.tamanho || 30}px; font-weight: 800; line-height: 1.1; color: ${opcoes.corValor || cor.texto};">${valor}</div></div>`;

    const linhasAmostras = amostras.length ? amostras.map(a => `
        <tr style="border-bottom: 1px solid ${cor.linha}; page-break-inside: avoid;">
            <td style="padding: 14px 12px; font-size: 10px; font-weight: 700; color: ${cor.texto};">${esc(a.codigo_amostra)}</td>
            <td style="padding: 14px 12px; font-size: 10px; color: ${cor.texto};">${esc(a.nome_propriedade)}</td>
            <td style="padding: 14px 12px; font-size: 10px; color: ${cor.texto};">${esc(a.categoria)}<div style="margin-top: 5px; font-size: 9px; color: ${cor.suave};">${esc(a.cultivar)}</div></td>
            <td style="padding: 14px 12px; font-size: 10px; color: ${cor.texto};">${esc(a.nome_concurso)}${a.ano_concurso ? `<div style="margin-top: 5px; font-size: 9px; color: ${cor.suave};">${escaparProdutor(a.ano_concurso)}</div>` : ''}</td>
            <td style="padding: 14px 12px; font-size: 12px; font-weight: 800; color: ${cor.verde}; text-align: center;">${formatarNota(a.nota_final)}</td>
        </tr>`).join('')
        : `<tr><td colspan="5" style="padding: 16px; text-align: center; font-size: 10px; font-style: italic; color: ${cor.suave};">Nenhuma amostra encontrada.</td></tr>`;

    const element = document.createElement('div');
    element.style.cssText = `width: 720px; padding: 4px 6px; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: ${cor.texto}; background: #fff;`;
    element.innerHTML = `
        <header style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 1px solid ${cor.linha};">
            <div>
                <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.4px; color: ${cor.marrom};">REGIÃO VULCÂNICA</div>
                <div style="margin-top: 6px; font-size: 8px; letter-spacing: 0.5px; color: ${cor.suave};">CAFÉ VULCÂNICO &nbsp;/&nbsp; RASTREABILIDADE</div>
            </div>
            <div style="min-width: 150px;">
                <div style="${rotulo}">Emissão</div>
                <div style="margin-top: 4px; font-size: 12px; color: ${cor.texto};">${emissao}</div>
            </div>
        </header>

        <h1 style="margin: 22px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 400; color: ${cor.marrom};">Relatório do produtor</h1>
        <p style="margin: 8px 0 26px; font-size: 10.5px; color: ${cor.suave};">Identificação, propriedades e histórico de amostras</p>

        <section style="position: relative; background: ${cor.bege}; border-radius: 12px; padding: 18px 22px 20px;">
            <span style="position: absolute; left: 0; top: 16px; width: 4px; height: 30px; background: ${cor.destaque}; border-radius: 0 3px 3px 0;"></span>
            <div style="${rotulo}">Identificação do produtor</div>
            <div style="margin: 8px 0 22px; font-size: 22px; font-weight: 800; color: ${cor.marrom};">${esc(p.nome_produtor)}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; row-gap: 16px; column-gap: 24px;">
                ${campo('Município', p.municipio)}
                ${campo('Associação', p.associacoes)}
                ${campo('Telefone', p.telefone)}
                ${campo('Assistência técnica', p.assistencias)}
                ${campo('E-mail', p.email)}
                ${campo('Gênero do produtor', p.genero)}
            </div>
        </section>

        ${tituloSecao('01', 'Resumo da produção')}
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            ${cartao('Amostras registradas', amostras.length)}
            ${cartao('Média SCA', Number(p.media_notas) > 0 ? formatarNota(p.media_notas) : 'Sem nota', { fundo: cor.verdeFundo, corRotulo: cor.verde, corValor: cor.verde, tamanho: Number(p.media_notas) > 0 ? 30 : 18 })}
            ${cartao(cultivares.length > 1 ? 'Cultivares' : 'Cultivar', esc(cultivares.join(', ')), { tamanho: cultivares.join(', ').length > 18 ? 14 : 22 })}
        </div>

        <div style="margin-top: 26px; padding-bottom: 16px; border-bottom: 1px solid ${cor.linha};">
            <div style="${rotulo}">${propriedades.length > 1 ? 'Propriedades' : 'Propriedade'}</div>
            <div style="margin-top: 8px; font-size: 13px; font-weight: 700; color: ${cor.marrom};">${esc(propriedades.join(', '))}</div>
        </div>

        ${tituloSecao('02', 'Histórico de amostras')}
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left;">
            <thead>
                <tr style="background: ${cor.marrom}; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                    <th style="padding: 12px; border-radius: 8px 0 0 8px;">Código</th>
                    <th style="padding: 12px;">Propriedade</th>
                    <th style="padding: 12px;">Categoria / Cultivar</th>
                    <th style="padding: 12px;">Evento</th>
                    <th style="padding: 12px; text-align: center; border-radius: 0 8px 8px 0;">SCA</th>
                </tr>
            </thead>
            <tbody>${linhasAmostras}</tbody>
        </table>
    `;

    const nomeArquivo = String(p.nome_produtor || 'produtor').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const opt = {
        margin: [12, 12, 26, 12],
        filename: `relatorio_produtor_${nomeArquivo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'section'] }
    };

    // Rodapé desenhado em todas as páginas, com numeração "atual / total".
    const pdf = await html2pdf().set(opt).from(element).toPdf().get('pdf');
    const total = pdf.internal.getNumberOfPages();
    const largura = pdf.internal.pageSize.getWidth();
    const altura = pdf.internal.pageSize.getHeight();
    for (let pagina = 1; pagina <= total; pagina++) {
        pdf.setPage(pagina);
        pdf.setDrawColor(232, 222, 211);
        pdf.setLineWidth(0.2);
        pdf.line(12, altura - 20, largura - 12, altura - 20);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(42, 29, 22);
        pdf.text('Associação de Produtores da Região Vulcânica - Café Vulcânico', 12, altura - 14);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(122, 106, 94);
        pdf.text('Relatório oficial de rastreabilidade gerado pelo sistema.', 12, altura - 9.5);
        pdf.text(`${pagina} / ${total}`, largura - 12, altura - 9.5, { align: 'right' });
    }
    return { pdf, nomeArquivo: opt.filename };
}
