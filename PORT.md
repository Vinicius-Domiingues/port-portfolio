# Port — portfólio demonstrativo

O Port usa exclusivamente o banco `port_demo`. A configuração recusa qualquer outro nome de banco. Não importa registros do projeto principal: todos os dados iniciais são gerados por `scripts/seed-demo.cjs`.

## Executar localmente

1. Configure `backend/.env` usando `backend/.env.example` como referência e informe as credenciais do seu MySQL.
2. Na pasta `backend`, execute `npm run seed:demo` uma única vez. O comando cria o banco e recusa sobrescrever tabelas existentes.
3. Execute `npm run dev`. A API do Port usa a porta **3002**.
4. Abra `frontend/login.html`.

Administrador: `admin@example.test`. Produtor: `produtor1@example.test`. Senha das contas de demonstração: `PortDemo2026!`.

A base contém 13 usuários, 3 concursos, 12 produtores, 48 amostras e 12 solicitações de selo. Nomes, contatos, propriedades e avaliações são fictícios. Não há coordenadas nem laudos de pessoas reais. Os e-mails usam o domínio reservado `.test` e os telefones são inválidos intencionalmente.

As permissões de administrador e produtor continuam vigentes nesta etapa. O acesso público ao dashboard será tratado separadamente.

Os backups do Port usam `backups/port` dentro deste projeto. Não restaure backups do projeto principal aqui. Não publique `.env`, uploads reais ou exportações antigas. O repositório do Port tem histórico próprio, iniciado sem os commits do projeto original. A cópia local `.git-gestao-backup` é ignorada e não deve ser publicada.
