// Lê o original em transação somente leitura e grava apenas dados anonimizados no Port.
const mysql = require('../backend/node_modules/mysql2/promise');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const config = require('../backend/port-config.cjs');
const tables = ['usuarios', 'concursos', 'amostras', 'solicitacoes_selos'];
// Preserva inclusive grafias/espaços distintos que existem na organização de origem.
const key = value => String(value ?? '');
const populated = (value, replacement) => value === null || value === '' ? value : replacement;
function mapper(prefix, sourceGroups) {
    const values = new Map();
    return value => {
        if (value === null || value === '') return value;
        const k = sourceGroups?.get(value) ?? key(value);
        if (!values.has(k)) values.set(k, `${prefix} ${String(values.size + 1).padStart(2, '0')}`);
        return values.get(k);
    };
}
async function main() {
    assert.equal(config.database, 'port_demo');
    const original = await mysql.createConnection({...config, database:'gestao_cafe', dateStrings:true});
    let target;
    try {
        await original.query('START TRANSACTION READ ONLY');
        const source = {};
        for (const table of tables) {
            // Não lê hashes de senha das contas originais.
            const columns = table === 'usuarios' ? 'id, nome, email, role, criado_em' : table === 'amostras'
                ? '*, DENSE_RANK() OVER (ORDER BY nome_produtor) AS demo_nome_produtor, DENSE_RANK() OVER (ORDER BY nome_propriedade) AS demo_nome_propriedade, DENSE_RANK() OVER (ORDER BY municipio) AS demo_municipio' : '*';
            source[table] = (await original.query(`SELECT ${columns} FROM ?? ORDER BY id`, [table]))[0];
        }
        await original.rollback();
        const groups = field => new Map(source.amostras.map(a=>[a[field],a['demo_'+field]]));
        const producer = mapper('Produtor Demo', groups('nome_produtor'));
        const property = mapper('Propriedade Demonstrativa', groups('nome_propriedade'));
        const city = mapper('Cidade Exemplo', groups('municipio'));
        source.amostras.forEach(a => producer(a.nome_produtor));
        const emails = new Map();
        let admins = 0, users = 0;
        const email = originalEmail => {
            if (originalEmail === null || originalEmail === '') return originalEmail;
            const k = key(originalEmail);
            if (!emails.has(k)) emails.set(k, `contato${emails.size + 1}@example.test`);
            return emails.get(k);
        };
        const data = {usuarios:[], concursos:[], amostras:[], solicitacoes_selos:[]};
        for (const u of source.usuarios) {
            assert(['organizador','produtor'].includes(u.role), 'Cargo não reconhecido.');
            const admin = u.role === 'organizador';
            const index = admin ? ++admins : ++users;
            const fictitiousEmail = admin ? (index === 1 ? 'admin@example.test' : `admin${index}@example.test`) : `produtor${index}@example.test`;
            emails.set(key(u.email), fictitiousEmail);
            const sample = source.amostras.find(a => key(a.email) === key(u.email) && a.email);
            const nameMatch = source.amostras.find(a => key(a.nome_produtor) === key(u.nome));
            data.usuarios.push({id:u.id,nome:admin ? `Administrador Demo ${index}` : producer((sample || nameMatch)?.nome_produtor || u.nome),email:fictitiousEmail,role:u.role,criado_em:'2026-01-01 10:00:00'});
        }
        assert(admins > 0, 'Não há administrador para acesso à demonstração.');
        data.concursos = source.concursos.map((c,i) => ({id:c.id,nome:`Concurso Demonstrativo ${i+1}`,ano:2026,status:c.status,data_criacao:'2026-01-01 10:00:00'}));
        let recovered = 0;
        for (const a of source.amostras) {
            if (a.concurso_id !== null && !data.concursos.some(c=>c.id===a.concurso_id)) {
                data.concursos.push({id:a.concurso_id,nome:`Concurso Demonstrativo Recuperado ${++recovered}`,ano:2025,status:'Fechado',data_criacao:'2025-01-01 10:00:00'});
            }
        }
        data.amostras = source.amostras.map((a,i) => {
            // Lista explícita: nenhuma coluna textual nova do original é copiada por acidente.
            const identity = Number(producer(a.nome_produtor)?.match(/\d+$/)?.[0] || i+1);
            return {
                id:a.id,concurso_id:a.concurso_id,codigo_amostra:`DEMO-${String(i+1).padStart(3,'0')}`,
                nome_produtor:producer(a.nome_produtor),municipio:city(a.municipio),nome_propriedade:property(a.nome_propriedade),
                categoria:a.categoria,cultivar:a.cultivar,nota_final:a.nota_final,
                altitude_media:populated(a.altitude_media,900+identity*10),altitude_maxima:populated(a.altitude_maxima,1000+identity*10),
                idade:populated(a.idade,25+identity%40),telefone:populated(a.telefone,'(00) 00000-0000'),email:email(a.email),
                uso_terra:populated(a.uso_terra,'Própria'),area_cafe:populated(a.area_cafe,5+identity%20),area_total:populated(a.area_total,30+identity%40),
                participa_associacao:populated(a.participa_associacao,'Associação Demonstrativa'),num_pes:populated(a.num_pes,10000+identity*100),
                producao_sacas:populated(a.producao_sacas,30+identity),coordenadas:null,
                assistencia_tecnica:populated(a.assistencia_tecnica,'Sim'),certificacoes:populated(a.certificacoes,'Certificação Demonstrativa'),
                perfil_sensorial:populated(a.perfil_sensorial,['Chocolate, caramelo e nozes','Frutado, cítrico e floral','Mel, cacau e amêndoas'][i%3]),
                data_cadastro:`2026-${String(1+Math.floor(i/28)%10).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')} 10:00:00`,
                genero:populated(a.genero,identity%2?'Feminino':'Masculino'),quantidade_sacas:populated(a.quantidade_sacas,10+identity),arquivo_laudo:null
            };
        });
        data.solicitacoes_selos = source.solicitacoes_selos.map(s=>({id:s.id,amostra_id:s.amostra_id,status:s.status==='Concluída'?'Aprovado':s.status,data_solicitacao:'2026-03-01 10:00:00'}));
        assert(data.solicitacoes_selos.every(s=>data.amostras.some(a=>a.id===s.amostra_id)), 'Selo sem amostra.');
        const distinct = (rows, field) => new Set(rows.filter(r=>r[field]!==null).map(r=>key(r[field]))).size;
        for (const field of ['nome_produtor','nome_propriedade','municipio']) assert.equal(distinct(data.amostras,field),new Set(source.amostras.filter(a=>a[field]!==null).map(a=>a['demo_'+field])).size);
        for (const table of ['usuarios','amostras','solicitacoes_selos']) assert.equal(data[table].length,source[table].length);
        assert(data.amostras.every(a=>!a.email||a.email.endsWith('@example.test')));
        assert(data.amostras.every(a=>a.coordenadas===null && a.arquivo_laudo===null));
        const password = await bcrypt.hash('PortDemo2026!',10);
        target = await mysql.createConnection({...config,dateStrings:true});
        const backup = {};
        for (const table of tables) backup[table]=(await target.query('SELECT * FROM ??',[table]))[0];
        const backupDir = path.join(__dirname,'../backups/port');
        await fs.mkdir(backupDir,{recursive:true});
        const backupFile=path.join(backupDir,`antes-copia-${Date.now()}.json`);
        await fs.writeFile(backupFile,JSON.stringify(backup,null,2),{flag:'wx'});
        // Somente dados fictícios chegam ao arquivo distribuível e ao banco do Port.
        await fs.writeFile(path.join(__dirname,'../backend/demo-data.json'),JSON.stringify(data,null,2)+'\n');
        await target.beginTransaction();
        for (const table of ['solicitacoes_selos','amostras','concursos','usuarios']) await target.query('DELETE FROM ??',[table]);
        for (const table of tables) for (const row of data[table]) await target.query('INSERT INTO ?? SET ?',[table,table==='usuarios'?{...row,senha:password}:row]);
        for (const table of tables) {
            const [[count]]=await target.query('SELECT COUNT(*) AS n FROM ??',[table]);
            assert.equal(count.n,data[table].length);
        }
        await target.commit();
        console.log(JSON.stringify({banco:'port_demo',contagens:Object.fromEntries(tables.map(t=>[t,data[t].length])),produtores:distinct(data.amostras,'nome_produtor'),propriedades:distinct(data.amostras,'nome_propriedade'),municipios:distinct(data.amostras,'municipio'),concursosRecuperados:recovered,backup:backupFile},null,2));
    } catch (error) { if(target) await target.rollback(); throw error; }
    finally { await original.end(); if(target) await target.end(); }
}
main().catch(error=>{console.error(error.code||'',error.message);process.exitCode=1;});
