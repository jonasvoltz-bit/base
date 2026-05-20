# Assistente Teológico — Igreja Seara

Agente de IA que responde perguntas sobre os sermões pregados na Igreja Seara, conectado ao Notion.

---

## Pré-requisitos

- Node.js 18+
- Conta na [Vercel](https://vercel.com) (gratuita)
- Chave da [API Anthropic](https://console.anthropic.com)
- Integration do [Notion](https://www.notion.so/my-integrations)

---

## 1. Configurar a Integration do Notion

1. Acesse [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Clique em **"+ New integration"**
3. Dê o nome `seara-agent` e selecione o workspace da Seara
4. Em **Capabilities**, marque **Read content**
5. Copie o **Internal Integration Secret** (começa com `secret_...`)
6. Vá até a página **Seara_Data_Services** no Notion
7. Clique em `···` (canto superior direito) → **Connections** → adicione a integration `seara-agent`

---

## 2. Rodar localmente

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas chaves
# ANTHROPIC_API_KEY=sk-ant-...
# NOTION_API_KEY=secret_...
# NOTION_PAGE_ID=35ecb449-aac3-80d3-9bd3-e5f55d5a0823

# Iniciar
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## 3. Deploy na Vercel

### Via GitHub (recomendado)

1. Suba o projeto para um repositório no GitHub
2. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório
3. Em **Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` → sua chave da Anthropic
   - `NOTION_API_KEY` → o secret da integration do Notion
   - `NOTION_PAGE_ID` → `35ecb449-aac3-80d3-9bd3-e5f55d5a0823`
4. Clique em **Deploy**

A Vercel vai gerar uma URL pública tipo `seara-agent.vercel.app`.

### Via CLI

```bash
npm i -g vercel
vercel
# Siga as instruções e adicione as env vars quando solicitado
```

---

## 4. Adicionar domínio personalizado (opcional)

No painel da Vercel, vá em **Domains** e adicione um domínio próprio, ex: `chat.igrejaseara.com.br`.

---

## Estrutura do projeto

```
seara-agent/
├── app/
│   ├── layout.jsx           # Layout raiz
│   ├── page.jsx             # Interface do chat
│   └── api/
│       ├── chat/route.js    # Endpoint do chat (Claude)
│       └── sermons/route.js # Lista de sermões (Notion)
├── lib/
│   └── notion.js            # Helpers da API do Notion
├── .env.example             # Variáveis necessárias
└── package.json
```

---

## Como adicionar novos sermões

Basta adicionar uma nova subpágina dentro de **Seara_Data_Services** no Notion com a transcrição do culto. O agente vai buscar automaticamente na próxima conversa (cache de 5 minutos).

---

## Custos estimados

| Item | Custo |
|------|-------|
| Vercel (Hobby) | Gratuito |
| Anthropic API | ~$0,003 por pergunta (Sonnet) |
| Notion API | Gratuito |

Para um uso típico de 100 perguntas/mês, o custo com a Anthropic fica em torno de **R$ 1,50/mês**.
