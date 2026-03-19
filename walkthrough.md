# Family Finance App - Walkthrough

## O que foi desenvolvido

- Backend em **Hono.js** configurado para a edge do **Cloudflare Workers**.
- Banco de dados **Cloudflare D1** (SQLite serverless) arquitetado via `wrangler.jsonc` com as migrations prontas (`0001_initial_schema.sql`).
- Frontend 100% Responsivo, com foco em Acessibilidade e Mobile-first, construído com **React, Vite e Vanilla CSS**.
- Integração nativa de tema Claro/Escuro e tamanhos flexíveis projetados com variáveis CSS `:root` e salvos localmente e na nuvem.
- Integração de Single Sign-On (SSO) preparada para usar o provedor oficial do **Google OAuth**.
- Engine financeiro suportando despesas únicas, registro automático de dívidas parceladas e assinaturas contínuas.
- Divisão de contas avançada com validação e bloqueio automático para fechamento exato dos balanços líquidos de cada participante.
- Dashboard inteligente para apuração automática de "Quem deve a Quem" e cálculo de saldo líquido familiar.
- Sistema de notificações in-app para registro das movimentações em tempo real.

## Visual Design e Acessibilidade

Conforme requisitado:

1. **Design Vibrante e Premium**: Utilizamos a fonte moderna "Outfit" (do Google Fonts), somada a gradientes sofisticados e um sistema de design de cores coeso com índigo e esmeralda.
2. **Layout Mobile-First**: O App baseia-se em uma *Bottom Navigation Bar* para conforto com os polegares (no celular), dispensando barras laterais pesadas.
3. **Preferências Familiares Separadas**: Sua mãe pode entrar, definir para o "Modo Claro" e "Fontes Extragrandes" (aumentando até os botões e os espaçamentos dinamicamente), enquanto você pode usar o "Modo Escuro" normal.
4. **Dialog de Confirmação**: O App possui agora um componente Modal Customizável (Dialog), evitando os `swal` ou alertas `window.confirm` sem padronização do navegador. Essa janela pode ser abortada comodamente pela tecla `ESC` ou tocando/clicando fora da caixa.

## Como obter seu Google CLIENT_ID

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um **Novo Projeto**.
3. Vá em **APIs e Serviços** > **Tela de consentimento OAuth**. Marque como "Externo", preencha o título do app, seu email e clique em Salvar/Continuar até o fim. Depois clique em "Publicar Aplicativo".
4. Vá em **APIs e Serviços** > **Credenciais**. Clique em **+ Criar Credenciais** > **ID do cliente OAuth**.
5. Escolha **"Aplicativo da Web"**.
6. Em **Origens JavaScript autorizadas**, adicione a URL que o Vite gerar (geralmente `http://localhost:5173`). Quando der deploy, adicione a URL pública também.
7. Clique em criar. Copie a string gigante do "ID do cliente" (termina em `.apps.googleusercontent.com`).

## Como testar localmente e configurar

1. No seu `web/src/main.tsx`, cole o seu `CLIENT_ID` copiado no passo anterior na variável `GOOGLE_CLIENT_ID`.
2. Abra dois terminais. No primeiro, rode o backend: `cd api && npm run dev`
3. No segundo, rode o frontend: `cd web && npm run dev`
*(Nota: o banco local já foi criado no seu diretório)*

## Como realizar o deploy (Nuvem da Cloudflare)

Para colocar seu app no ar na Cloudflare, acesse seu terminal logado no macOS e utilize a ferramenta oficial (`wrangler`):

1. **Autenticação**:
   Rode `npx wrangler login` (se ainda não fez login neste mac).

2. **Configuração do D1**:
   - Dentro da pasta `api`, crie o DB de produção: `npx wrangler d1 create family-finance-db`
   - O comando retornará um `database_id` hash. Substitua essa string lá no arquivo `api/wrangler.jsonc`.
   - Crie as tabelas na nuvem: `npx wrangler d1 migrations apply family-finance-db --remote`

3. **Deploy do Backend (Workers)**:
   - Na pasta `api`, rode: `npm run deploy` (ou `npx wrangler deploy`).
   - Copie o URL (Ex: `https://api.seunome.workers.dev`) que será gerado no terminal.

4. **Deploy do Frontend (Pages)**:
   - Em `web/src/context/AuthContext.tsx`, troque `export const API_URL = 'http://localhost:8787';` pela URL que copiou.
   - Entre na pasta `web` e aplique o build: `npm run build`
   - Envie para nuvem: `npx wrangler pages deploy dist`

> [!TIP]
> Google OAuth em Produção
> Não se esqueça de adicionar a URL do front-end que será gerada (Ex: `https://...pages.dev`) na lista de Módulos de Autorização do Console do Google Cloud no momento do deploy.
