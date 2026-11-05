# Port — portfólio demonstrativo

O Port usa exclusivamente o banco `port_demo`. A configuração recusa qualquer outro nome de banco. Os dados anonimizados estão em `backend/demo-data.json` e são carregados por `scripts/seed-demo.cjs`.

## Executar localmente

1. Configure `backend/.env` usando `backend/.env.example` como referência e informe as credenciais do seu MySQL.
2. Na pasta `backend`, execute `npm run seed:demo` uma única vez. O comando cria o banco e recusa sobrescrever tabelas existentes.
3. Execute `npm run dev`. A API do Port usa a porta **3002**.
4. Abra `frontend/login.html`.

Administrador: `admin@example.test`. Produtor: `produtor1@example.test`. Senha das contas de demonstração: `PortDemo2026!`.

A base contém 6 usuários, 2 concursos, 50 produtores e 67 amostras, sem solicitações de selo. Nomes, contatos e propriedades são fictícios; as distribuições de categorias, cultivares e notas foram preservadas. Não há coordenadas nem laudos de pessoas reais. Os e-mails usam o domínio reservado `.test` e os telefones são inválidos intencionalmente.

As permissões de administrador e produtor continuam vigentes nesta etapa. O acesso público ao dashboard será tratado separadamente.

## Base organizada a partir do original

A base mantém os vínculos e as distribuições de cultivares, categorias e notas do sistema original. Os 50 produtores, 47 propriedades e 16 municípios recebem nomes fictícios consistentes. Contatos, dados pessoais, datas e informações livres foram substituídos; coordenadas e arquivos de laudo foram removidos. Senhas originais não são lidas nem copiadas.

O original possui um concurso válido e quatro amostras ligadas a um concurso ausente. A cópia inclui um segundo concurso, identificado como recuperado, para manter essas quatro amostras acessíveis. Como o original não tinha solicitações de selo, a lista de selos começa vazia.

`npm run seed:demo` carrega apenas o arquivo fictício, sem precisar do banco original. O script de manutenção `scripts/copy-original-demo.cjs` refaz a cópia local: consulta `gestao_cafe` em transação somente leitura, salva um backup do Port em `backups/port` e substitui somente `port_demo`. Não o execute para inicializar uma instalação comum.

Os backups do Port usam `backups/port` dentro deste projeto. Não restaure backups do projeto principal aqui. Não publique `.env`, uploads reais ou exportações antigas. O repositório do Port tem histórico próprio, iniciado sem os commits do projeto original. A cópia local `.git-gestao-backup` é ignorada e não deve ser publicada.
