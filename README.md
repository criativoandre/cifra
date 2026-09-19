# Cifra App

Monorepo com os dois apps (PWA) e o pacote compartilhado entre eles.
Backend: Supabase, projeto `cifras` (São Paulo) — já com schema, RLS e o
primeiro usuário administrador criados.

```
apps/
  musico/     -> app do músico (PWA): login, biblioteca, visualizador de cifra
  admin/      -> painel administrativo: dashboard, cifras, repertórios, membros
packages/
  shared/     -> cliente Supabase, auth, tipos do banco, motor de transposição/diagramas
```

## Rodando localmente

Precisa de Node 18+.

```bash
npm install
npm run dev:musico   # abre em http://localhost:5173
npm run dev:admin    # abre em http://localhost:5174
```

Faça login com o e-mail/senha que você já configurou no Supabase
(André Araujo / criativoandre@gmail.com, função Administrador).

## Variáveis de ambiente

`apps/musico/.env` já vem preenchido com a URL e a chave publicável do
projeto Supabase (`sb_publishable_...`). Essa chave é segura de ficar
pública/no código — ela só habilita o que a RLS permitir para cada usuário.
**Nunca** coloque a `service_role key` no frontend.

## O que já funciona (app do músico)

- Login de verdade (Supabase Auth) — sem "criar conta", só quem foi
  convidado consegue entrar.
- Biblioteca: busca, filtro por repertório (com a cor de cada um), lista de
  cifras — tudo vindo do banco real, respeitando RLS (um Colaborador só
  vê repertório liberado, por exemplo).
- Visualizador, com tudo que a gente validou no protótipo em HTML:
  - Transposição de tom e diagramas de acorde no topo, clicáveis (toca no
    acorde do texto e ele rola/destaca o diagrama correspondente).
  - Ajuste de tamanho de fonte (até 20%) **e ajuste automático** que encolhe
    a fonte sozinho pra cifra nunca precisar de rolagem horizontal — em
    celular, tablet ou desktop, recalculando ao redimensionar a tela.
  - Rolagem automática com controle de velocidade.
  - Tablatura e batida (quando a cifra tem), com opção de ocultar.
  - Modo canhoto (espelha os diagramas).
  - Seletores de cor pra notas, bolinhas dos diagramas e letra, com
    "restaurar padrão".
  - Tema claro/escuro.
  - Painel de Opções em bottom sheet, popovers de Tom/Fonte/Rolagem
    ancorados no botão certo do rodapé.
  - Preferências (tema, cores, toggles) salvas no aparelho do usuário.
- Deslogar (menu no avatar da biblioteca).

## O que já funciona (painel admin)

- Login real (Supabase Auth), separado do app do músico.
- **Dashboard**: cartões de estatística e últimas cifras importadas, tudo
  vindo do banco.
- **Cifras**: busca, seletor de repertório por linha (grava direto no
  banco ao trocar), "+ Nova Cifra" já insere de verdade na tabela `cifras`
  (upload real de arquivo, mas o *conteúdo* ainda não é extraído — ver
  pendências), remover com popup de confirmação.
- **Repertório**: cartões com cor, contagem de cifras, badge "Não
  liberado", Editar/Remover reais. Remover só apaga a pasta — as cifras
  voltam pra "Sem repertório", nunca são excluídas.
- **Membros**: convite de verdade — chama a Edge Function `invite-member`
  (que usa a service_role key no servidor, nunca no navegador) e dispara
  o e-mail de convite do Supabase de fato. Só Administrador acessa esta
  tela (escondida do menu e bloqueada por RLS pra quem tentar entrar
  direto pela URL).
- Regras de função (Administrador / Editor / Colaborador) aplicadas na
  interface e reforçadas por RLS no banco — um Colaborador, por exemplo,
  não vê nenhum botão de escrita.
- Deslogar (menu no chip "Admin" do topo).

## O que ainda falta (próximos passos)

- **O parser de PDF (`parse-cifra`) precisa de um teste real.** Escrevi ele
  usando `unpdf` (pdf.js rodando em Deno/edge) com a mesma lógica de
  coluna/alinhamento que validamos em Python — mas não tenho como invocar
  uma Edge Function real daqui de dentro pra confirmar que ela roda sem
  erro dentro do ambiente do Supabase. **Preciso que você teste**: rode o
  admin localmente, vá em Cifras → "+ Nova Cifra" e suba um dos PDFs do
  Cifra Club que já usamos antes (ex: "Autor da Vida" ou "A Boa Parte").
  Se aparecer um erro, me manda o print — eu consigo ver os logs da
  function e corrigir a partir daí.
- Deploy dos dois apps em algum lugar de verdade (Vercel, Netlify, Cloudflare
  Pages...) — hoje só rodam localmente.
- Configurar um provedor de e-mail de verdade no Supabase (o padrão tem
  limite bem baixo, só serve pra teste) — decisão adiada por você.
- Não existe ainda tela de editar o conteúdo de uma cifra já cadastrada
  (só criar e trocar de repertório) — se o parser errar algo, hoje não dá
  pra corrigir pela interface ainda.

## Edge Functions (Supabase)

Já deployadas direto no projeto (não precisam de nenhum passo extra pra
rodar):
- `definir-senha` — página de primeiro acesso (aceite de convite).
- `invite-member` — convida um membro (usa a `service_role` key no
  servidor; o admin app chama isso via `supabase.functions.invoke`).
- `parse-cifra` — extrai título/cantor/tom/afinação/compositor e o
  conteúdo (acorde+letra alinhado por coluna) de um PDF ou TXT enviado.
  **Ainda não testada com um upload real** — ver pendências acima.

## Banco de dados (Supabase)

Todas as migrations já foram aplicadas diretamente no projeto via MCP
(schema, RLS, trigger de convite, storage bucket). Não há arquivos `.sql`
neste repositório ainda — se quiser versionar isso localmente também,
use `supabase db pull` com a CLI do Supabase apontando pro projeto
`apfmxidhzxihfkzsbyih`.
