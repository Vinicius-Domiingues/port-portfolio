const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('../backend/node_modules/typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,file);
const jwt = require('../backend/node_modules/jsonwebtoken');
const express = require('../backend/node_modules/express');
let nota = 0, existe = true, gravados = [];
const fakeDb = {execute: async (sql, params) => {
    if (sql.includes('SELECT id, nome, email, role')) return [[{id:params[0],role:params[0]===1?'organizador':'produtor'}]];
    if (sql.includes('SELECT a.nota_final')) return [existe ? [{nota_final:nota}] : []];
    if (sql.startsWith('UPDATE solicitacoes_selos')) { gravados.push(params[0]); return [{affectedRows:existe?1:0}]; }
    throw new Error('SQL inesperado: '+sql);
}};
const dbPath = path.resolve(__dirname,'../backend/src/config/database.ts');
require.cache[dbPath] = {id:dbPath,filename:dbPath,loaded:true,exports:{__esModule:true,default:fakeDb}};
const app = express(); app.use(express.json()); app.use('/api',require('../backend/src/routes/seloRoutes.ts').default);
const server = app.listen(0,'127.0.0.1');
(async()=>{
    await new Promise(resolve=>server.once('listening',resolve));
    const token = id => jwt.sign({id},process.env.JWT_SECRET||'port_demo_local_secret_change_for_deployment');
    const call = async(status,expected,id=1) => {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/selos/1`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token(id)}`},body:JSON.stringify({status})});
        assert.equal(response.status,expected); return response.json();
    };
    for (nota of [null,0,79.99,'inválida']) {
        for (const status of ['Aprovado','Concluída']) assert.match((await call(status,400)).error,/80 pontos/);
    }
    assert.equal(gravados.length,0);
    for (nota of [80,'88.40']) {
        await call('Aprovado',200); await call('Concluída',200);
    }
    assert.deepEqual(gravados,['Aprovado','Aprovado','Aprovado','Aprovado']);
    await call('Aprovado',403,2);
    await call('qualquer',400);
    existe=false; await call('Aprovado',404); await call('Rejeitado',404);
    console.log('Aprovação validada: nota mínima, status legado, permissões, status inválido e selo ausente. Banco simulado.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
