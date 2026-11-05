# Port — Gestão de Café

Projeto de portfólio para demonstrar uma aplicação de gestão de amostras de café, produtores, concursos e solicitações de selos.

Este repositório é independente do sistema original. A base de demonstração utiliza exclusivamente dados fictícios.

## Tecnologias e funcionalidades

- Backend em Node.js, TypeScript e Express, com MySQL.
- Frontend em HTML, CSS e JavaScript.
- Autenticação JWT e senhas protegidas com bcrypt.
- Dashboard, cadastro de amostras, gestão de produtores, concursos e selos.
- Perfis de administrador e produtor.

## Executar

Requisitos: Node.js, npm e MySQL 8.

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Configure as credenciais locais do MySQL em `backend/.env` e execute:

```powershell
npm run seed:demo
npm run dev
```

Abra `frontend/login.html` no navegador. A API local utiliza `http://localhost:3002` e o banco isolado `port_demo`.

| Perfil | E-mail | Senha de demonstração |
| --- | --- | --- |
| Administrador | admin@example.test | PortDemo2026! |
| Produtor | produtor1@example.test | PortDemo2026! |

O seed cria 6 usuários, 50 produtores, 2 concursos e 67 amostras, sem solicitações de selo. Ele recusa sobrescrever um banco já inicializado. Não utiliza dados nem laudos reais.

## Verificar

Na raiz do projeto:

```powershell
node scripts/test-user-access.cjs
node scripts/verify-demo.cjs
```

O primeiro comando testa permissões com banco simulado. O segundo valida login, consultas e os dados de uma base de demonstração recém-criada.

Veja [PORT.md](PORT.md) para detalhes da configuração local. A publicação deste repositório não hospeda automaticamente a aplicação ou o MySQL.
