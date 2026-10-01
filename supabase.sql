-- Rode este script no Supabase: SQL Editor > New query > Run
-- Pode ser rodado mais de uma vez sem erro.

create table if not exists pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  papel text not null check (papel in ('aluno','professor')),
  curso text,
  orientador text,
  temas text[] not null default '{}',
  colabs text[] not null default '{}',   -- nomes dos colegas em ordem de prioridade
  criado_em timestamptz not null default now()
);

create table if not exists config (
  id int primary key default 1 check (id = 1),
  fase int not null default 1             -- sem uso (antigo controle de etapas)
);
insert into config (id, fase) values (1, 1) on conflict do nothing;

-- Se a tabela veio de uma versão anterior (colabs como uuid[]), converte para nomes
do $$
begin
  if (select data_type from information_schema.columns
      where table_name = 'pessoas' and column_name = 'colabs') = 'ARRAY'
     and (select udt_name from information_schema.columns
          where table_name = 'pessoas' and column_name = 'colabs') = '_uuid' then
    alter table pessoas alter column colabs drop default;
    alter table pessoas alter column colabs type text[] using colabs::text[];
    alter table pessoas alter column colabs set default '{}';
  end if;
end $$;

alter table pessoas enable row level security;
alter table config  enable row level security;

-- Qualquer pessoa com o link pode ver, cadastrar e editar (nao apagar)
drop policy if exists "ler pessoas"      on pessoas;
drop policy if exists "inserir pessoas"  on pessoas;
drop policy if exists "editar pessoas"   on pessoas;
drop policy if exists "admin apaga"      on pessoas;
drop policy if exists "ler config"       on config;
drop policy if exists "admin altera cfg" on config;

create policy "ler pessoas"      on pessoas for select using (true);
create policy "inserir pessoas"  on pessoas for insert with check (true);
create policy "editar pessoas"   on pessoas for update using (true) with check (true);
-- Somente o admin logado apaga
create policy "admin apaga"      on pessoas for delete to authenticated using (true);

create policy "ler config"       on config for select using (true);
create policy "admin altera cfg" on config for update to authenticated using (true) with check (true);

-- Tempo real (só adiciona se ainda não estiver)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pessoas') then
    alter publication supabase_realtime add table pessoas;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'config') then
    alter publication supabase_realtime add table config;
  end if;
end $$;
