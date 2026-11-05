/* Adaptador de leitura usado exclusivamente no pacote estático do GitHub Pages. */
const API_BASE_URL = location.origin;
let vitrine;

window.iniciarVitrine = async function () {
    document.getElementById('botoesAuth').classList.add('hidden');
    document.getElementById('menuUsuarioLogado').classList.remove('hidden');
    document.getElementById('avatarUsuario').textContent = 'AD';
    document.getElementById('nomeUsuarioBtn').textContent = 'Administrador';
    document.getElementById('nomeDropdown').textContent = 'Administrador Demo';
    document.getElementById('emailDropdown').textContent = 'Demonstração · somente consulta';
    const admin = document.getElementById('gestaoUsuarios');
    admin.classList.remove('hidden');
    admin.href = 'administrador.html';
    const sair = document.querySelector('#dropdownUsuario button');
    sair.removeAttribute('onclick');
    sair.onclick = () => { location.href = 'index.html'; };
    try {
        const response = await fetch('data/demo.json');
        if (!response.ok) throw new Error('Dados indisponíveis');
        vitrine = await response.json();
        return 'visitante';
    } catch {
        document.getElementById('nomeConcursoAtivo').textContent = 'Não foi possível carregar a demonstração.';
        document.getElementById('subtituloPainel').textContent = 'Recarregue a página para tentar novamente.';
    }
};

function agruparProdutores() {
    const grupos = new Map();
    for (const a of vitrine.amostras) {
        if (!grupos.has(a.nome_produtor)) grupos.set(a.nome_produtor, []);
        grupos.get(a.nome_produtor).push(a);
    }
    return Array.from(grupos, ([nome_produtor, amostras]) => {
        const primeira = amostras[0];
        const valores = campo => [...new Set(amostras.map(a => a[campo]).filter(Boolean))];
        const notas = amostras.map(a => Number(a.nota_final)).filter(n => n > 0);
        return {
            nome_produtor, municipio: primeira.municipio, telefone: primeira.telefone, email: primeira.email, genero: primeira.genero,
            propriedades: valores('nome_propriedade').join(', '), total_propriedades: valores('nome_propriedade').length,
            municipios: valores('municipio').join(', '), cultivares: valores('cultivar').join(', '),
            associacoes: valores('participa_associacao').join(', '), assistencias: valores('assistencia_tecnica').join(', '),
            total_amostras: amostras.length, media_notas: notas.length ? notas.reduce((a,b) => a+b, 0) / notas.length : null
        };
    }).sort((a,b) => a.nome_produtor.localeCompare(b.nome_produtor, 'pt-BR'));
}

async function apiFetch(url, options = {}) {
    if ((options.method || 'GET').toUpperCase() !== 'GET') return Response.json({error:'Você pode explorar e preencher o formulário. O salvamento está desativado nesta demonstração para preservar os dados dos próximos visitantes.'}, {status:405});
    if (!vitrine) {
        const response = await fetch('data/demo.json');
        if (!response.ok) return Response.json({error:'Dados indisponíveis.'}, {status:503});
        vitrine = await response.json();
    }
    const {pathname, searchParams} = new URL(url, location.href);
    if (pathname === '/api/concursos') return Response.json(vitrine.concursos);
    if (pathname === '/api/amostras') {
        const id = Number(searchParams.get('concurso_id'));
        return Response.json(vitrine.amostras.filter(a => a.concurso_id === id).sort((a,b) => Number(b.nota_final)-Number(a.nota_final)));
    }
    if (pathname === '/api/selos') return Response.json(vitrine.selos);
    if (pathname === '/api/produtores') return Response.json(agruparProdutores());
    if (pathname.startsWith('/api/produtores/')) {
        const nome = decodeURIComponent(pathname.slice('/api/produtores/'.length));
        const produtor = agruparProdutores().find(p => p.nome_produtor === nome);
        if (produtor) return Response.json({produtor, cadastro:vitrine.amostras.find(a => a.nome_produtor === nome), amostras:vitrine.amostras.filter(a => a.nome_produtor === nome).map(a => {
            const concurso = vitrine.concursos.find(c => c.id === a.concurso_id);
            return {...a, nome_concurso:concurso?.nome, ano_concurso:concurso?.ano};
        })});
    }
    return Response.json({error:'Registro não encontrado.'}, {status:404});
}
