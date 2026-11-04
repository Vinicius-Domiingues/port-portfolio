const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('../backend/node_modules/typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const express = require('../backend/node_modules/express');
const db = require('../backend/src/config/database.ts').default;
const app = express();
app.use(express.json());
for (const route of ['auth', 'amostra', 'produtor', 'concurso', 'selo']) app.use('/api', require(`../backend/src/routes/${route}Routes.ts`).default);
let server;
async function main() {
    const [[identity]] = await db.query('SELECT DATABASE() AS name');
    assert.equal(identity.name, 'port_demo');
    const [[invalid]] = await db.query("SELECT COUNT(*) AS n FROM amostras WHERE nome_produtor NOT LIKE 'Produtor Demo %' OR email NOT LIKE '%@example.test' OR telefone <> '(00) 00000-0000' OR coordenadas IS NOT NULL OR arquivo_laudo IS NOT NULL");
    assert.equal(invalid.n, 0);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.test', senha: 'PortDemo2026!' }) });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    for (const [route, count] of [['usuarios', 13], ['amostras', 48], ['produtores', 12], ['concursos', 3], ['selos', 12]]) {
        const result = await fetch(`${base}/${route}`, { headers: { Authorization: `Bearer ${token}` } });
        assert.equal(result.status, 200, route);
        const body = await result.json();
        assert.equal(body.length, count, route);
        console.log(`${route}: ${body.length} registros fictícios; HTTP 200`);
    }
    console.log('Banco isolado, contatos fictícios, ausência de laudos/coordenadas e login verificados.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (server) await new Promise(resolve => server.close(resolve)); await db.end(); });
