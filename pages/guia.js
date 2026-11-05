/* Guia da vitrine: acompanha a navegação sem bloquear os controles. */
(() => {
    const key = 'port-guia-v3';
    const resume = new URLSearchParams(location.search).get('guia');
    const admin = !!document.getElementById('avisoAdmin');
    const cadastro = !!document.getElementById('formAmostra');
    let continuarCadastro = false;
    if (cadastro) { try { continuarCadastro = sessionStorage.getItem('port-tour-cadastro') === 'sim'; sessionStorage.removeItem('port-tour-cadastro'); } catch {} }
    let active = true;
    try { active = localStorage.getItem(key) !== 'concluido'; } catch {}
    if (admin) active = !!resume;
    if (cadastro) active = continuarCadastro;
    if (resume) active = true;
    let step = cadastro ? 6 : admin ? 4 : resume === 'amostra' ? 5 : -1, anchor = null, frame = 0;
    if (resume) { const url = new URL(location.href); url.searchParams.delete('guia'); history.replaceState(null, '', url); }
    const replay = document.createElement('button');
    replay.className = 'guia-reabrir';
    replay.textContent = '? Guia rápido';
    const bubble = document.createElement('aside');
    bubble.className = 'guia-balao';
    bubble.hidden = true;
    bubble.setAttribute('aria-label', 'Guia rápido do Port');
    bubble.innerHTML = '<button class="guia-fechar" aria-label="Fechar guia">×</button><small></small><h2></h2><p aria-live="polite"></p><button class="guia-avancar"></button><button class="guia-pular">Explorar por conta própria</button>';
    document.body.append(replay, bubble);
    const messages = [
        ['Explore os gráficos', 'Compare a distribuição das cultivares e a média sensorial dos municípios. Use os filtros para explorar as amostras.', 'Ver as amostras ↓'],
        ['Conheça o produtor', 'Clique no nome do produtor para abrir seu perfil, consultar as propriedades e ver suas amostras.', 'Abrir este perfil →'],
        ['Gere um relatório', 'No menu de três pontos, escolha “Gerar PDF / Relatório” para preparar o relatório deste produtor.', 'Voltar ao dashboard →'],
        ['Acesso ao administrador', 'O menu do perfil reúne a identificação da conta e o acesso à área de administrador.', 'Conhecer o administrador →'],
        ['Área do administrador', 'Aqui você conhece a gestão de contas e permissões. As alterações estão desativadas para preservar a demonstração para todos os visitantes.', 'Voltar ao dashboard →'],
        ['Cadastre uma nova amostra', 'Vamos conhecer o formulário de cadastro, etapa por etapa. Você pode preencher com dados fictícios, sem alterar a demonstração.', 'Abrir cadastro de amostra →'],
        ['1. Identificação do produtor', 'Aqui ficam nome, contato e demais dados do produtor. Você também pode buscar um produtor demonstrativo para reaproveitar seu cadastro. Não precisa preencher para continuar o tour.', 'Ver dados da propriedade →'],
        ['2. Dados da propriedade', 'Nesta etapa ficam propriedade, município, altitude e informações sobre a produção. Os botões de etapas permitem voltar e conferir os dados.', 'Ver dados da amostra →'],
        ['3. Lote e produção', 'Informe código, cultivar, categoria, quantidade e avaliação sensorial da amostra. Explore os campos com dados fictícios.', 'Onde salvar →'],
        ['Salvamento na demonstração', 'Este é o botão de salvar. Nesta vitrine, o salvamento está desativado: nenhum dado preenchido é enviado ou altera a experiência dos próximos visitantes.', 'Como voltar →'],
        ['Volte ao dashboard', 'Use este botão para sair do formulário e voltar ao painel. O tour termina aqui; depois você fica livre para explorar. Os campos preenchidos não serão salvos.', 'Voltar e concluir tour']
    ];
    function finish() {
        active = false;
        try { localStorage.setItem(key, 'concluido'); } catch {}
        update();
    }
    function visible(el) {
        if (!el || !el.getClientRects().length) return false;
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    }
    function update() {
        frame = 0;
        anchor?.classList.remove('guia-alvo');
        bubble.hidden = true;
        if (!active || (!admin && !cadastro && !document.querySelector('#tabelaAmostras button'))) return;
        if (cadastro && step >= 6 && step <= 8) {
            const tab = document.querySelector('.tab-content.active');
            if (tab) step = 5 + Number(tab.id.slice(-1));
        }
        const profile = document.querySelector('#perfilProdutor:not([hidden]) .perfil-acoes summary');
        const producer = document.querySelector('#tabelaAmostras button[onclick*="abrirModalPerfilProdutor"]');
        if (step === 1 && profile) step = 2;
        else if (step === 2 && !profile) step = 1;
        anchor = cadastro ? document.getElementById(['nome_produtor','nome_propriedade','codigo_amostra','btnSalvar','btnVoltarGlobal'][step-6]) : admin ? document.getElementById('avisoAdmin') : step === 5 ? document.getElementById('acaoCadastroPainel') : step === 3 ? document.getElementById('menuUsuarioContainer') : step === 2 ? profile : step === 1 ? producer : step === 0 ? document.getElementById('cultivarCloudContainer') : document.getElementById('nomeConcursoAtivo');
        if (!visible(anchor)) return;
        anchor.classList.add('guia-alvo');
        const [title, description, action] = step === -1 ? ['Quer conhecer o Port?', 'Faça um tour rápido pelos gráficos, produtores, relatórios, administrador e cadastro de amostras. Você pode sair quando quiser.', 'Iniciar tour'] : messages[step];
        bubble.querySelector('small').textContent = step === -1 ? 'TOUR OPCIONAL' : `GUIA DO PORT · ${step + 1}/${messages.length}`;
        bubble.querySelector('h2').textContent = title;
        bubble.querySelector('p').textContent = description;
        bubble.querySelector('.guia-avancar').textContent = action;
        bubble.querySelector('.guia-pular').hidden = step !== -1;
        bubble.hidden = false;
        let r = anchor.getBoundingClientRect();
        const menu = step === 2 ? profile.parentElement.querySelector('div') : step === 3 ? document.getElementById('dropdownUsuario') : null;
        if (visible(menu)) { const m = menu.getBoundingClientRect(); r = {left:Math.min(r.left,m.left),right:Math.max(r.right,m.right),top:Math.min(r.top,m.top),bottom:Math.max(r.bottom,m.bottom)}; }
        const b = bubble.getBoundingClientRect();
        const beside = (step === 2 || step === 3) && r.left > b.width + 24;
        const left = beside ? r.left-b.width-16 : Math.min(Math.max(12, r.left), innerWidth-b.width-12);
        const top = beside ? Math.min(r.top,innerHeight-b.height-12) : r.bottom+b.height+24 <= innerHeight ? r.bottom+12 : Math.max(12,r.top-b.height-12);
        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    bubble.querySelector('.guia-fechar').onclick = finish;
    bubble.querySelector('.guia-pular').onclick = finish;
    bubble.querySelector('.guia-avancar').onclick = () => {
        if (step === -1) {
            try { localStorage.setItem(key, 'concluido'); } catch {}
            step = 0;
            document.getElementById('cultivarCloudContainer').scrollIntoView({block:'center'});
            schedule();
        } else if (step === 0) {
            step = 1;
            document.querySelector('#tabelaAmostras button[onclick*="abrirModalPerfilProdutor"]')?.scrollIntoView({block:'center', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
            schedule();
        } else if (step === 1) anchor?.click();
        else if (step === 2) {
            window.fecharModalPerfilProdutor(); step = 3;
            setTimeout(() => { document.getElementById('dropdownUsuario').classList.remove('hidden'); schedule(); }, 0);
            document.getElementById('menuUsuarioContainer').scrollIntoView({block:'center'});
            schedule();
        }
        else if (step === 3) location.href = 'administrador.html?guia=admin';
        else if (step === 4) location.href = 'dashboard.html?guia=amostra';
        else if (step === 5) {
            try { sessionStorage.setItem('port-tour-cadastro', 'sim'); } catch {}
            window.irParaCadastro();
        }
        else if (step === 6 || step === 7) {
            const tab = step - 5;
            document.querySelectorAll('.tab-btn')[tab].click();
            step++;
            document.getElementById(step === 7 ? 'nome_propriedade' : 'codigo_amostra').scrollIntoView({block:'center'});
            schedule();
        }
        else if (step === 8 || step === 9) {
            step++;
            document.getElementById(step === 9 ? 'btnSalvar' : 'btnVoltarGlobal').scrollIntoView({block:'center'});
            schedule();
        }
        else if (step === 10) { finish(); window.voltarParaDashboard(); }
        else finish();
    };
    replay.onclick = () => {
        if (cadastro) {
            active = true; step = 6; document.querySelectorAll('.tab-btn')[0].click();
            document.getElementById('nome_produtor').scrollIntoView({block:'center'}); schedule(); return;
        }
        if (admin) { location.href = 'dashboard.html?guia=iniciar'; return; }
        if (!document.getElementById('perfilProdutor').hidden) window.fecharModalPerfilProdutor();
        active = true; step = -1; document.getElementById('nomeConcursoAtivo').scrollIntoView({block:'center'}); schedule();
    };
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && active) finish(); });
    document.addEventListener('scroll', schedule, true);
    document.addEventListener('click', schedule);
    document.addEventListener('click', event => {
        if (!active) return;
        if (step === 5 && event.target.closest('#acaoCadastroPainel')) {
            try { sessionStorage.setItem('port-tour-cadastro', 'sim'); } catch {}
        }
        if (cadastro && event.target.closest('#btnVoltarGlobal')) finish();
    }, true);
    document.addEventListener('toggle', schedule, true);
    window.addEventListener('resize', schedule);
    // Observa somente o conteúdo da aplicação, evitando observar o próprio balão.
    const observer = new MutationObserver(schedule);
    for (const id of ['tabelaAmostras', 'perfilProdutor']) {
        const el = document.getElementById(id);
        if (el) observer.observe(el, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
    }
    if (cadastro && active) document.getElementById('nome_produtor').scrollIntoView({block:'center'});
    schedule();
})();
