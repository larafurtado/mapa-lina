-- Rode este script inteiro no Supabase: SQL Editor > New query > Run

create table if not exists pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  papel text not null check (papel in ('aluno','professor')),
  curso text,
  orientador text,
  temas text[] not null default '{}',
  colabs uuid[] not null default '{}',   -- ids em ordem de prioridade
  criado_em timestamptz not null default now()
);

create table if not exists config (
  id int primary key default 1 check (id = 1),
  fase int not null default 1             -- 1 = cadastro de nomes, 2 = temas e colaboradores
);
insert into config (id, fase) values (1, 1) on conflict do nothing;

alter table pessoas enable row level security;
alter table config  enable row level security;

-- Qualquer pessoa com o link pode ver, cadastrar e editar (nao apagar)
create policy "ler pessoas"      on pessoas for select using (true);
create policy "inserir pessoas"  on pessoas for insert with check (true);
create policy "editar pessoas"   on pessoas for update using (true) with check (true);
-- Somente o admin logado apaga
create policy "admin apaga"      on pessoas for delete to authenticated using (true);

create policy "ler config"       on config for select using (true);
create policy "admin altera cfg" on config for update to authenticated using (true) with check (true);

-- Tempo real
alter publication supabase_realtime add table pessoas, config;
