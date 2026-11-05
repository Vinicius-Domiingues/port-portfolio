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
    copy(path.join(pages,'config.js'), 'assets/js/config.js');
    const dashboard = fs.readFileSync(path.join(frontend,'dashboard.html'),'utf8');
    fs.writeFileSync(path.join(output,'dashboard.html'), dashboard.replace('</head>', '<link rel="stylesheet" href="pages.css">\n</head>'));
    const assets = {
        css:['login','dashboard-analise','perfil','produtores','selos-sidebar'].map(name=>name+'.css'),
        js:['cultivar-cloud','dashboard-analise','perfil','produtores','relatorio-produtor','selos-sidebar'].map(name=>name+'.js'),
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
