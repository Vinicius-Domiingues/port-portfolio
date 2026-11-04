const mysql = require('../backend/node_modules/mysql2/promise');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../backend/port-config.cjs');

async function main() {
    const { database, ...connection } = config;
    const db = await mysql.createConnection(connection);
    try {
        // Não lê, copia ou altera registros de qualquer outro banco.
        await db.query('CREATE DATABASE IF NOT EXISTS `port_demo` CHARACTER SET utf8mb4');
        await db.changeUser({ database });
        const [existing] = await db.query('SHOW TABLES');
        if (existing.length) throw new Error('port_demo já contém tabelas. Nenhum dado foi substituído.');
        const schema = fs.readFileSync(path.join(__dirname, 'demo-schema.sql'), 'utf8');
        for (const sql of schema.split(';').map(s => s.trim()).filter(Boolean)) await db.query(sql);
        await db.beginTransaction();
        const password = await bcrypt.hash('PortDemo2026!', 10);
        await db.execute('INSERT INTO usuarios (nome,email,senha,role) VALUES (?,?,?,?)', ['Administrador Demo', 'admin@example.test', password, 'organizador']);
        for (let p = 1; p <= 12; p++) {
            await db.execute('INSERT INTO usuarios (nome,email,senha,role) VALUES (?,?,?,?)', [`Produtor Demo ${String(p).padStart(2, '0')}`, `produtor${p}@example.test`, password, 'produtor']);
        }
        for (let c = 1; c <= 3; c++) {
            await db.execute('INSERT INTO concursos (id,nome,ano,status) VALUES (?,?,?,?)', [c, `Concurso Demonstrativo ${c}`, 2023 + c, c === 3 ? 'Aberto' : 'Fechado']);
        }
        for (let i = 1; i <= 48; i++) {
            const p = (i - 1) % 12 + 1;
            const record = {
                concurso_id: (i - 1) % 3 + 1,
                codigo_amostra: `DEMO-${String(i).padStart(3, '0')}`,
                nome_produtor: `Produtor Demo ${String(p).padStart(2, '0')}`,
                municipio: ['Cidade Exemplo Norte', 'Cidade Exemplo Sul', 'Cidade Exemplo Leste', 'Cidade Exemplo Oeste'][p % 4],
                nome_propriedade: `Fazenda Demonstrativa ${p}`,
                categoria: ['Natural', 'Cereja Descascado', 'Fermentado'][i % 3],
                cultivar: ['Arara', 'Bourbon', 'Catuaí Amarelo', 'Mundo Novo'][i % 4],
                altitude_media: 850 + p * 25, altitude_maxima: 950 + p * 25,
                idade: 25 + p * 3, telefone: '(00) 00000-0000', email: `produtor${p}@example.test`,
                uso_terra: 'Própria', area_cafe: 5 + p, area_total: 15 + p * 2,
                participa_associacao: p % 2 ? 'Associação Demo' : 'Não',
                num_pes: 15000 + p * 1000, producao_sacas: 20 + i * 2,
                coordenadas: null, assistencia_tecnica: p % 2 ? 'Sim' : 'Não',
                certificacoes: p % 3 ? 'Nenhuma' : 'Certificação Demonstrativa',
                perfil_sensorial: ['Chocolate, caramelo e nozes', 'Frutado, cítrico e floral', 'Mel, cacau e amêndoas'][i % 3],
                nota_final: i % 8 === 0 ? 0 : Number((78 + (i * 7 % 55) / 5).toFixed(2)),
                data_cadastro: `2026-${String((i - 1) % 10 + 1).padStart(2, '0')}-15 10:00:00`,
                genero: p % 2 ? 'Feminino' : 'Masculino', quantidade_sacas: 10 + i,
                arquivo_laudo: null
            };
            const [result] = await db.query('INSERT INTO amostras SET ?', record);
            if (i % 4 === 0) await db.execute('INSERT INTO solicitacoes_selos (amostra_id,status) VALUES (?,?)', [result.insertId, i % 8 === 0 ? 'Pendente' : 'Aprovado']);
        }
        await db.commit();
        console.log('Port: 13 usuários, 3 concursos, 48 amostras e 12 solicitações fictícias criados.');
    } catch (error) {
        await db.rollback();
        throw error;
    } finally { await db.end(); }
}
main().catch(error => { console.error(error.code || '', error.message); process.exitCode = 1; });
