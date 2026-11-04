// Reaproveita apenas as etapas de produtor e propriedade em uma nova amostra.
(() => {
    if (amostraEdit || role !== 'organizador') return;

    const inputNome = document.getElementById('nome_produtor');
    const sugestoes = document.getElementById('sugestoesProdutor');
    const status = document.createElement('p');
    status.className = 'text-xs text-stone-500 mt-2';
    status.setAttribute('role', 'status');
    sugestoes.parentElement.appendChild(status);
    const normalizar = valor => (valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const campos = ['nome_produtor', 'email', 'telefone', 'genero', 'idade',
        'nome_propriedade', 'municipio', 'altitude_media', 'altitude_maxima',
        'coordenadas', 'uso_terra', 'participa_associacao'];
    const usosAnteriores = {
        Proprio: 'Proprietário', 'Próprio': 'Proprietário',
        Arrendado: 'Meeiro/Arrendatário', Parceria: 'Meeiro/Arrendatário',
        'Meeiro ou arrendatário': 'Meeiro/Arrendatário',
        Comodato: 'Comodatário', 'Comodatário ou usufrutuário': 'Comodatário'
    };
    let produtores = [];
    let requisicao = 0;
    let selecionado = '';

    async function selecionar(produtor) {
        if (selecionado === produtor.nome_produtor) return;
        const atual = ++requisicao;
        const nomeDigitado = inputNome.value;
        sugestoes.classList.add('hidden');
        status.textContent = 'Buscando os dados do produtor...';
        try {
            const resposta = await apiFetch(`${API_BASE_URL}/api/produtores/${encodeURIComponent(produtor.nome_produtor)}`);
            if (!resposta.ok) throw new Error('Falha ao buscar cadastro');
            const { cadastro } = await resposta.json();
            if (atual !== requisicao || inputNome.value !== nomeDigitado) return;
            if (!cadastro) throw new Error('Cadastro não encontrado');
            campos.forEach(id => {
                const campo = document.getElementById(id);
                // Nome e e-mail do produtor autenticado vêm da conta atual.
                if (campo.disabled) return;
                const valor = cadastro[id] ?? '';
                campo.value = id === 'uso_terra' ? (usosAnteriores[valor] || valor) : valor;
            });
            selecionado = produtor.nome_produtor;
            status.textContent = 'Dados do cadastro mais recente preenchidos nas etapas 1 e 2. Confira a propriedade e preencha a etapa 3 com a nova amostra.';
        } catch (erro) {
            if (atual !== requisicao) return;
            status.textContent = 'Não foi possível carregar os dados. Selecione o produtor novamente ou preencha manualmente.';
            console.error(erro);
        }
    }

    function sugerir() {
        sugestoes.replaceChildren();
        const termo = normalizar(inputNome.value);
        const encontrados = termo.length >= 2
            ? produtores.filter(p => normalizar(p.nome_produtor).includes(termo)) : [];
        encontrados.forEach(produtor => {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'w-full text-left px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50';
            botao.textContent = `${produtor.nome_produtor} — ${produtor.propriedades || produtor.municipio || ''}`;
            botao.addEventListener('click', () => selecionar(produtor));
            sugestoes.appendChild(botao);
        });
        sugestoes.classList.toggle('hidden', encontrados.length === 0);
    }

    function selecionarNomeExato() {
        const encontrados = produtores.filter(p => normalizar(p.nome_produtor) === normalizar(inputNome.value));
        if (encontrados.length === 1) selecionar(encontrados[0]);
    }

    if (role !== 'produtor') {
        inputNome.addEventListener('input', () => {
            requisicao++;
            selecionado = '';
            status.textContent = '';
            sugerir();
        });
        inputNome.addEventListener('change', selecionarNomeExato);
        document.addEventListener('click', evento => {
            if (!inputNome.contains(evento.target) && !sugestoes.contains(evento.target)) {
                sugestoes.classList.add('hidden');
            }
        });
    }

    window.addEventListener('DOMContentLoaded', async () => {
        try {
            const resposta = await apiFetch(`${API_BASE_URL}/api/produtores`);
            if (!resposta.ok) throw new Error('Falha ao listar produtores');
            produtores = await resposta.json();
            if (role === 'produtor') {
                const email = normalizar(localStorage.getItem('usuarioEmail'));
                const encontrados = produtores.filter(p => normalizar(p.nome_produtor) === normalizar(inputNome.value)
                    && email && normalizar(p.email) === email);
                if (encontrados.length === 1) await selecionar(encontrados[0]);
            } else if (document.activeElement === inputNome) {
                sugerir();
            } else {
                selecionarNomeExato();
            }
        } catch (erro) {
            status.textContent = 'A busca de produtores está indisponível. Você pode preencher o cadastro manualmente.';
            console.error(erro);
        }
    });
})();
