# Mapa temático do Lina

Site estático (HTML + JS) com banco em tempo real no Supabase.

| Arquivo | Para quê |
|---|---|
| `index.html` | Formulário (o QR code aponta para cá). Etapa 1: nome, papel, curso, orientador. Etapa 2: temas e colaboradores. |
| `grafo.html` | Grafo em tempo real, a única página pública de dados. Visões: pessoas + temas, só pessoas, só temas. |
| `admin.html` | Painel: QR code, liberar etapa 2, unir temas, apagar, exportar CSV/JSON. |
| `supabase.sql` | Cria as tabelas e permissões. |
| `config.js` | Chaves do Supabase. Vazio = modo demo (dados só no navegador). |

## Testar localmente (modo demo)

```bash
python3 -m http.server 8000
```
Abra `http://localhost:8000/admin.html` e clique em "Gerar dados de teste", depois abra `grafo.html`.

## Publicar (uma vez)

1. **Supabase** (supabase.com, plano gratuito): crie um projeto, abra *SQL Editor*, cole o conteúdo de `supabase.sql` e execute.
2. Em *Authentication > Users*, crie um usuário (seu e-mail e uma senha). Ele será o admin.
3. Em *Project Settings > API*, copie a **Project URL** e a chave **anon public** para `config.js`.
4. **GitHub**: crie um repositório, envie estes arquivos e ative *Settings > Pages* (branch `main`, pasta raiz).
5. Acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/admin.html`, entre, e projete o QR code.

## Dia da atividade

1. Projete o QR code (admin). Todos entram e preenchem a **etapa 1**.
2. Quando todos tiverem entrado, clique em **Liberar etapa 2**. Os celulares avançam sozinhos.
3. Projete `grafo.html`: ele se atualiza a cada resposta salva.
4. Ao final, use "Unir ou renomear temas" para juntar variações e exporte o CSV.

## Disponível o ano todo

- `.github/workflows/manter-ativo.yml` roda **2x por semana** no GitHub: consulta o Supabase (evita a pausa por inatividade do plano gratuito) e salva uma cópia dos dados em `data/pessoas.json`.
- Se o banco ficar fora do ar, o `grafo.html` abre sozinho com essa cópia (somente leitura) após 3 s e avisa na barra superior.
- Se a rotina falhar (por exemplo, projeto pausado), o GitHub envia um e-mail de erro. Nesse caso, entre no painel do Supabase e clique em **Restore**.
- Para testar agora: no repositório, *Actions > Manter Supabase ativo e salvar cópia > Run workflow*.
- O GitHub desativa rotinas agendadas após 60 dias sem atividade no repositório; se isso acontecer, reative em *Actions*.

## Limites conhecidos

- Não há login para participantes: quem tem o link pode cadastrar e, tecnicamente, editar cadastros de outros. Para um laboratório fechado é aceitável; apagar exige login de admin.
- A chave `anon` do Supabase é pública por natureza. Os dados ficam protegidos pelas regras do `supabase.sql`.
- O orientador é casado com o professor cadastrado pelo nome (sem acentos/maiúsculas). Se o professor nunca se cadastrar, ele aparece no grafo como nó vazado (contorno sem preenchimento).
