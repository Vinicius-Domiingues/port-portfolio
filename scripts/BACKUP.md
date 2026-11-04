# Backup do Port

Na pasta do projeto, execute:

```powershell
node scripts/backup.cjs --verify-restore
```

Requer Node, as dependências do backend e MySQL Server 8.0 instalado. Para outra instalação, defina MYSQL_BIN com o diretório que contém mysqldump.exe e mysql.exe. O script lê a configuração atual de backend/port-config.cjs e backend/.env; se o formato dessa configuração mudar, revise o script.

Cada execução cria uma pasta backup-DATA-UTC em `backups/port`, dentro do projeto, com port_demo.sql, uploads/ e manifest.json (tamanhos, hashes SHA-256 e contagem das tabelas restauradas). A senha não é incluída no backup nem nos argumentos dos processos. Backups incompletos ficam identificados como incompleto-DATA e não devem ser usados como cópias válidas. Se mudar de computador, ajuste backupRoot em backup.cjs.

O teste importa o SQL em um banco temporário exclusivo e remove apenas esse banco ao terminar. Não altera o banco original. A retenção remove backups completos com mais de 30 dias somente após concluir um novo backup.

Execute de preferência fora do horário de cadastro e sem mudanças na estrutura das tabelas. O dump usa uma transação consistente para tabelas InnoDB; a cópia dos arquivos não é uma transação conjunta com o banco.

O agendamento automático está pausado por solicitação do usuário. Execute novos backups somente quando o usuário pedir. O computador e o MySQL precisam estar disponíveis para a execução local.

As cópias ficam no mesmo computador. Guarde também uma cópia da pasta completa do backup em um destino externo com acesso restrito. Nenhum destino externo está configurado.

Para recuperar o sistema, primeiro importe port_demo.sql em um banco separado usando o cliente MySQL, confira os dados e restaure uploads/ para backend/uploads. A substituição do banco ativo deve ser planejada explicitamente para evitar perda dos registros posteriores ao backup.
