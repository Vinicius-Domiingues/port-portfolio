const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const pages = path.join(root, 'pages');

function buildPages() {
    // Cada publicação começa em uma pasta vazia: arquivos de uma versão anterior não entram no pacote.
    const dist = path.join(root, 'dist');
    fs.mkdirSync(dist, {recursive:true});
    const output = fs.mkdtempSync(path.join(dist, 'port-pages-'));
    const copy = (from, relative) => {
        const dest = path.join(output, relative);
        fs.mkdirSync(path.dirname(dest), {recursive:true});
        fs.copyFileSync(from, dest);
    };
    copy(path.join(pages,'index.html'), 'index.html');
    copy(path.join(pages,'pages.css'), 'pages.css');
    copy(path.join(pages,'guia.js'), 'assets/js/guia.js');
    copy(path.join(pages,'administrador.js'), 'assets/js/administrador.js');
    const admin = fs.readFileSync(path.join(frontend,'registro.html'),'utf8')
        .replace('style="visibility:hidden"', '')
        .replaceAll('Região Vulcânica', 'Port')
        .replace('REGIÃO<br>VULCÂNICA<small>BUSINESS INTELLIGENCE</small>', 'PORT<small>PORTFÓLIO DIGITAL</small>')
        .replace('</head>', '<link rel="stylesheet" href="pages.css"></head>')
        .replace(/<dialog[\s\S]*$/, '<script src="assets/js/administrador.js"></script><script src="assets/js/guia.js"></script></body></html>')
        .replace('<main>', '<main><aside id="avisoAdmin" class="demo-aviso"><strong>Administrador · demonstração de consulta</strong><p>Você pode explorar as contas e permissões. Cadastro, edição e alterações de acesso estão desativados para preservar a experiência dos próximos visitantes.</p></aside>');
    fs.writeFileSync(path.join(output,'administrador.html'), admin);
    const cadastro = fs.readFileSync(path.join(frontend,'cadastro.html'),'utf8')
        .replaceAll('Região Vulcânica', 'Port')
        .replace('</head>', '<link rel="stylesheet" href="pages.css"></head>')
        .replace("const role = localStorage.getItem('usuarioRole');", "const role = 'organizador';")
        .replace('if (!token) {', 'if (!token && !window.iniciarVitrine) {')
        .replace("const amostraEdit = JSON.parse(localStorage.getItem('amostraParaEditar'));", 'const amostraEdit = null;')
        .replace('const authHeader = token ?', 'const authHeader = false ?')
        .replace('<form', '<aside class="demo-aviso" role="note"><strong>Cadastro demonstrativo</strong><p>Explore as etapas e preencha os campos com dados fictícios. O salvamento está desativado para preservar os dados dos próximos visitantes. Nenhuma informação preenchida será enviada.</p></aside><form');
    fs.writeFileSync(path.join(output,'cadastro.html'), cadastro.replace(/<\/body>\s*<\/html>\s*$/, '<script src="assets/js/guia.js"></script>\n</body>\n</html>'));
    copy(path.join(pages,'config.js'), 'assets/js/config.js');
    const dashboard = fs.readFileSync(path.join(frontend,'dashboard.html'),'utf8');
    fs.writeFileSync(path.join(output,'dashboard.html'), dashboard.replace('</head>', '<link rel="stylesheet" href="pages.css">\n</head>').replace(/<\/body>\s*<\/html>\s*$/, '<script src="assets/js/guia.js"></script>\n</body>\n</html>'));
    const assets = {
        css:['login','dashboard-analise','perfil','produtores','selos-sidebar','usuarios','cadastro'].map(name=>name+'.css'),
        js:['cultivar-cloud','dashboard-analise','perfil','produtores','relatorio-produtor','selos-sidebar','cadastro-produtor'].map(name=>name+'.js'),
        img:['logo branco.png','logo.png','perfil_cover.png','sidebar_coffee_bg.jpg','seal_coffee_bg.jpg','Img inicial login.png','cultivar-ramo.svg']
    };
    for (const [type, files] of Object.entries(assets)) for (const file of files) {
        const relative = path.join('assets',type,file);
        copy(path.join(frontend,relative), relative);
    }
    const source = JSON.parse(fs.readFileSync(path.join(root,'backend/demo-data.json'),'utf8'));
    const cols = ['id','concurso_id','codigo_amostra','nome_produtor','municipio','nome_propriedade','categoria','cultivar','nota_final','perfil_sensorial','altitude_media','altitude_maxima','genero','idade','quantidade_sacas','data_cadastro','uso_terra','participa_associacao','assistencia_tecnica','certificacoes','telefone','email'];
    const select = (row, fields) => Object.fromEntries(fields.map(field=>[field,row[field]]));
    const amostras = source.amostras.map(a => {
        if (!/^Produtor Demo \d+$/.test(a.nome_produtor) || (a.email && !a.email.endsWith('@example.test')) || (a.telefone && a.telefone!=='(00) 00000-0000') || a.arquivo_laudo || a.coordenadas) {
            throw new Error('A publicação requer amostras demonstrativas anonimizadas.');
        }
        return select(a,cols);
    });
    const concursos = source.concursos.map(c=>select(c,['id','nome','ano','status']));
    const selos = source.solicitacoes_selos.map(s => {
        const amostra = amostras.find(a => a.id === s.amostra_id);
        if (!amostra) throw new Error('Solicitação sem amostra correspondente.');
        return {...amostra,...select(s,['id','amostra_id','status','data_solicitacao'])};
    });
    fs.mkdirSync(path.join(output,'data'));
    fs.writeFileSync(path.join(output,'data/demo.json'),JSON.stringify({concursos,amostras,selos}));
    return output;
}
module.exports = buildPages;
if (require.main === module) {
    const output = buildPages();
    console.log(output);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `path=${output}\n`);
}
