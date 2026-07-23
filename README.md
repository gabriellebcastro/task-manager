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

Sem bibliotecas de UI externas, sem roteador, sem gerenciador de estado externo — tudo construído com React hooks nativos.

---

## Estrutura do Projeto

```
task-manager/
├── src/
│   ├── app.jsx           # Componente principal e toda a lógica da aplicação
│   ├── main.jsx          # Ponto de entrada — renderiza o app React
│   ├── styles.css        # Estilos globais e sistema de temas com CSS custom properties
│   └── tweaks-panel.jsx  # Painel de personalização visual (temas, densidade, cores)
├── index.html            # HTML base
├── vite.config.js        # Configuração do Vite
└── package.json          # Metadados e dependências
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (incluído com o Node.js)

---

## Como rodar

**1. Instale as dependências:**

```bash
npm install
```

**2. Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` com Hot Module Replacement ativado.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Serve o build de produção localmente para testes |
