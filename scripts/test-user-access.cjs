const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('../backend/node_modules/typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,file);
const express=require('../backend/node_modules/express');
const jwt=require('../backend/node_modules/jsonwebtoken');
const bcrypt=require('../backend/node_modules/bcryptjs');
const users=[{id:1,nome:'Admin teste',email:'admin@example.test',role:'organizador'},{id:2,nome:'Produtor teste',email:'produtor@example.test',role:'produtor'}];
let failDb=false;
const fakeDb={execute:async(sql,params=[])=>{
 sql=sql.trim();
 if(failDb)throw Error('offline');
 if(sql.startsWith('SELECT id, nome, email, role FROM usuarios WHERE'))return [users.filter(u=>u.id===params[0]).map(u=>({...u}))];
 if(sql.startsWith('SELECT id, nome, email, role, criado_em FROM usuarios ORDER'))return [users.map(({senha,...u})=>u)];
 if(sql.startsWith('SELECT id FROM usuarios WHERE email'))return [users.filter(u=>u.email===params[0])];
 if(sql.startsWith('SELECT id FROM usuarios WHERE id'))return [users.filter(u=>u.id===params[0])];
 if(sql.startsWith('INSERT INTO usuarios')){if(users.some(u=>u.email===params[1]))throw Object.assign(Error(),{code:'ER_DUP_ENTRY'});users.push({id:users.length+1,nome:params[0],email:params[1],senha:params[2],role:params[3]});return [{insertId:users.length}];}
 if(sql.startsWith('UPDATE usuarios SET role')){users.find(u=>u.id===params[1]).role=params[0];return [{affectedRows:1}];}
 if(sql.includes('SELECT nota_final, email FROM amostras'))return [[{nota_final:0,email:'produtor@example.test'}]];
 if(sql.includes('solicitacoes_selos'))return [sql.startsWith('INSERT')?{insertId:1}:[]];
 if(sql.startsWith('SELECT'))return [[]];
 throw Error('SQL inesperado: '+sql);
}};
const dbPath=path.resolve(__dirname,'../backend/src/config/database.ts');
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{__esModule:true,default:fakeDb}};
const app=express();app.use(express.json());
for(const name of ['auth','produtor','concurso','amostra','selo'])app.use('/api',require('../backend/src/routes/'+name+'Routes.ts').default);
let server;
(async()=>{
 server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/api';
 const token=(id,role='produtor')=>jwt.sign({id,role},process.env.JWT_SECRET||'port_demo_local_secret_change_for_deployment',{expiresIn:'1h'});
 const admin=token(1),producer=token(2,'organizador');
 let checks=0;
 async function call(route,status,auth,method='GET',body){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})});assert.equal(r.status,status,method+' '+route);checks++;return r.json();}
 await call('/auth/registro',401,null,'POST',{});
 await call('/auth/registro',403,producer,'POST',{});
 await call('/usuarios',401);await call('/usuarios',403,producer);
 for(const route of ['/produtores','/concursos','/amostras']){await call(route,401);await call(route,403,producer);await call(route,200,admin);}
 for(const [route,method] of [['/produtores/teste','PUT'],['/produtores/teste','DELETE'],['/concursos','POST'],['/concursos/1','PUT'],['/concursos/1','DELETE'],['/amostras/1','PUT'],['/amostras/1','DELETE']])await call(route,403,producer,method,{});
 await call('/usuarios/1/administrador',403,producer,'PATCH');
 await call('/usuarios/999/administrador',404,admin,'PATCH');
 await call('/usuarios/abc/administrador',400,admin,'PATCH');
 await call('/auth/registro',400,admin,'POST',{nome:'Novo',email:'errado',senha:'12345678'});
 await call('/auth/registro',400,admin,'POST',{nome:'Novo',email:'novo@example.test',senha:'curta'});
 await call('/auth/registro',201,admin,'POST',{nome:' Novo ',email:' NOVO@EXAMPLE.TEST ',senha:'SenhaTeste123',role:'organizador'});
 assert.equal(users[2].role,'produtor');assert.equal(users[2].email,'novo@example.test');assert(await bcrypt.compare('SenhaTeste123',users[2].senha));checks+=3;
 await call('/auth/registro',409,admin,'POST',{nome:'Novo',email:'novo@example.test',senha:'SenhaTeste123'});
 const listed=await call('/usuarios',200,admin);assert(listed.every(u=>!('senha' in u)));checks++;
 await call('/selos',201,producer,'POST',{amostra_id:1});
 await call('/usuarios/2/administrador',200,admin,'PATCH');
 const me=await call('/auth/me',200,producer);assert.equal(me.usuario.role,'organizador');checks++;
 await call('/usuarios',200,producer);
 await call('/auth/me',401,'invalid');await call('/auth/me',401,token(999));
 failDb=true;await call('/usuarios',503,admin);failDb=false;
 console.log(checks+' verificações passaram; banco simulado, sem alterar contas reais.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server?.close());
