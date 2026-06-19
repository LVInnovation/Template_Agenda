# Template de Agendamento Cru

Modelo base em React + Vite para vender, duplicar e personalizar para diferentes clientes.

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Rotas principais

- `/` - site público.
- `/modelo-config` - área escondida para trocar tema, nome, textos da home, contatos e serviços em destaque.
- `/admin` - painel operacional livre, sem login.
- `/agenda` - agenda diária.
- `/pacotes-ativos` - controle de pacotes.
- `/meus-agendamentos` - consulta pública por telefone.

## Onde personalizar

- Configuração central: `src/content/siteContent.ts`.
- Temas e cores: `src/config/appConfig.ts`.
- Banco local/mock: `src/services/localDatabase.ts`.

O projeto está sem backend, sem credenciais e sem dados reais. Tudo fica salvo no `localStorage` do navegador enquanto você não conectar uma base própria.

## Temas disponíveis

- Claro Elegante
- Claro Suave
- Colorido Profissional
- Escuro Premium
- Escuro Moderno

## Para conectar backend depois

Substitua a camada `src/services/localDatabase.ts` por chamadas para sua API ou servidor. A maior parte das telas usa essa camada como fonte de dados, então a troca fica concentrada.
