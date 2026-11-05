const mysql = require('../backend/node_modules/mysql2/promise');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../backend/port-config.cjs');
const data = require('../backend/demo-data.json');
async function main() {
 const {database,...connection}=config;
 const db=await mysql.createConnection(connection);
 try {
  await db.query('CREATE DATABASE IF NOT EXISTS `port_demo` CHARACTER SET utf8mb4');
  await db.changeUser({database});
  const [existing]=await db.query('SHOW TABLES');
  if(existing.length) throw new Error('port_demo já contém tabelas. Nenhum dado foi substituído.');
  const schema=fs.readFileSync(path.join(__dirname,'demo-schema.sql'),'utf8');
  for(const sql of schema.split(';').map(s=>s.trim()).filter(Boolean)) await db.query(sql);
  await db.beginTransaction();
  const senha=await bcrypt.hash('PortDemo2026!',10);
  for(const table of ['usuarios','concursos','amostras','solicitacoes_selos']) {
   for(const row of data[table]) await db.query('INSERT INTO ?? SET ?',[table,table==='usuarios'?{...row,senha}:row]);
  }
  await db.commit();
  console.log('Base fictícia carregada: 6 usuários, 67 amostras e 2 concursos.');
 } catch(error) {await db.rollback();throw error;}
 finally {await db.end();}
}
main().catch(error=>{console.error(error.code||'',error.message);process.exitCode=1;});