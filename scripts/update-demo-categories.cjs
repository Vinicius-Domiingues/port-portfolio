const mysql = require('../backend/node_modules/mysql2/promise');
const config = require('../backend/port-config.cjs');
const categoriaDemo = require('./demo-categories.cjs');
async function main() {
    if (require('node:fs').existsSync(require('node:path').join(__dirname, '../backend/demo-data.json'))) {
        throw new Error('A base atual preserva as categorias do original. Este script serve somente à demonstração antiga de 48 amostras.');
    }
    if (config.database !== 'port_demo') throw new Error('Permitido somente no Port.');
    const db = await mysql.createConnection(config);
    try {
        await db.beginTransaction();
        let total = 0;
        for (let i = 1; i <= 48; i++) {
            const produtor = (i - 1) % 12 + 1;
            const [result] = await db.execute(
                'UPDATE amostras SET categoria = ? WHERE codigo_amostra = ? AND nome_produtor = ? AND email = ? AND concurso_id = ?',
                [categoriaDemo(i), `DEMO-${String(i).padStart(3, '0')}`, `Produtor Demo ${String(produtor).padStart(2, '0')}`, `produtor${produtor}@example.test`, (i - 1) % 3 + 1]
            );
            total += result.affectedRows;
        }
        const [distribuicao] = await db.query('SELECT concurso_id, categoria, COUNT(*) AS quantidade FROM amostras GROUP BY concurso_id, categoria ORDER BY concurso_id, categoria');
        await db.commit();
        console.log(JSON.stringify({ amostrasDemoEncontradas: total, distribuicao }, null, 2));
    } catch (error) { await db.rollback(); throw error; }
    finally { await db.end(); }
}
main().catch(error => { console.error(error.code || '', error.message); process.exitCode = 1; });
