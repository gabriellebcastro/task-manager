# Task Manager

Uma aplicação web de gerenciamento de tarefas, construída com React e Vite.

## Status

🚧 **Em desenvolvimento** — interface e lógica de estado implementadas. 
Próximos passos: persistência de dados, testes automatizados e integração com backend.

---

## Funcionalidades

- **Criar, editar e excluir tarefas** com título, descrição, data/hora de vencimento e prioridade
- **Três níveis de prioridade:** Alta, Média e Baixa (codificados por cores)
- **Fluxo de status em 3 etapas:** Pendente → Em Andamento → Concluída
- **Agrupamento por data:** Hoje, Amanhã, Ontem e datas específicas
- **Arquivo:** visualize tarefas concluídas separadas da lista ativa
- **Filtros avançados** por status, prioridade e data (Atrasadas, Hoje, Esta Semana, Sem Data)
- **Destaque de tarefas atrasadas** em vermelho
- **Contador de tarefas:** Total, Pendentes, Em Andamento e Concluídas

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.3.1 | UI e gerenciamento de estado |
| React-DOM | 18.3.1 | Renderização no navegador |
| Vite | 6.3.5 | Dev server e build |
| @vitejs/plugin-react | 4.3.4 | Fast Refresh e transpilação JSX |
| Node.js | 20 | Runtime do servidor |
| Express | 4.x | API REST |
| Prisma | 6.x | ORM |
| SQLite | — | Banco de dados |

Sem bibliotecas de UI externas, sem roteador, sem gerenciador de estado externo — tudo construído com React hooks nativos.

---

## Estrutura do Projeto

```
task-manager/
├── server/
│   ├── index.js              # API Express com rotas CRUD
│   ├── package.json          # Dependências do backend
│   ├── .env.example          # Template de variáveis de ambiente
│   └── prisma/
│       └── schema.prisma     # Schema do banco de dados
├── src/
│   ├── app.jsx
│   ├── main.jsx
│   ├── styles.css
│   └── tweaks-panel.jsx
├── .github/
│   └── workflows/
│       └── ci.yml            # Pipeline CI/CD
├── index.html
├── vite.config.js
└── package.json
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (incluído com o Node.js)

---

## Como rodar

**Frontend (React):**

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` com Hot Module Replacement ativado.

**Backend (API):**

1. Entre na pasta do servidor:
```bash
cd server
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Inicialize o banco de dados:
```bash
npm run db:generate
npm run db:push
```

4. Inicie o servidor:
```bash
npm run dev
```

A API estará disponível em `http://localhost:3001`.

---

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /health | Health check |
| GET | /api/tasks | Lista todas as tarefas |
| POST | /api/tasks | Cria uma tarefa |
| PUT | /api/tasks/:id | Atualiza uma tarefa |
| DELETE | /api/tasks/:id | Remove uma tarefa |

---

## Scripts disponíveis

**Frontend:**

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Serve o build de produção localmente para testes |

**Backend** (em `server/`):

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API com hot reload |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:push` | Sincroniza o schema com o banco |
