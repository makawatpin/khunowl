-- MheeTang / KhunOwl Life OS — Supabase schema v1
-- Run via `supabase db push` (put in supabase/migrations/0001_init.sql). Currency: THB unless noted. TZ: Asia/Bangkok.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ───────── enums ─────────
create type account_type as enum ('cash','savings','checking','ewallet','investment');
create type txn_type as enum ('expense','income','transfer');
create type cycle_t as enum ('monthly','quarterly','semiannual','yearly');
create type split_mode as enum ('equal','items','custom');
create type task_pri as enum ('high','medium','low');
create type vehicle_kind as enum ('car','motorcycle');

-- ───────── helper ─────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────── profile / prefs ─────────
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  prefs jsonb not null default '{"hide":false,"theme":"light","motion":"on","notify":false}', -- pin hash stays client-side
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── money ─────────
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, type account_type not null default 'savings',
  bank text,                         -- key into bank logo set: kbank, scb, bbl, ktc, truemoney, cash ...
  last4 text, opening_balance numeric(14,2) not null default 0,
  sort int not null default 0, pinned boolean not null default false, archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, bank text, network text, last4 text,
  credit_limit numeric(14,2) not null default 0, opening_used numeric(14,2) not null default 0,
  statement_date date, due_date date, min_payment numeric(14,2) not null default 0,
  sort int not null default 0, pinned boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type txn_type not null, amount numeric(14,2) not null check (amount > 0),
  date date not null default (now() at time zone 'Asia/Bangkok')::date,
  time time, name text not null, category text, note text, tags text[] not null default '{}',
  src_account_id uuid references accounts(id) on delete restrict,
  src_card_id    uuid references cards(id)    on delete restrict,
  to_account_id  uuid references accounts(id) on delete restrict,   -- transfer target
  to_card_id     uuid references cards(id)    on delete restrict,   -- card payment target
  ref text,                           -- 'bill:<id>:<due>' | 'sub:<id>:<date>' | 'slip:<bank ref>' | 'trip:<id>'  (idempotency)
  attachment_path text,               -- storage: receipts/<uid>/...
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (num_nonnulls(src_account_id, src_card_id) = 1),
  check (type <> 'transfer' or num_nonnulls(to_account_id, to_card_id) = 1)
);
create unique index transactions_ref_uq on transactions(user_id, ref) where ref is not null;
create index transactions_user_date on transactions(user_id, date desc);
create index transactions_name_trgm on transactions using gin (name gin_trgm_ops);

create table bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, domain text, amount numeric(14,2) not null, cycle cycle_t not null default 'monthly',
  next_due date not null, account_id uuid references accounts(id) on delete set null,
  auto_debit boolean not null default false, last_paid date, remind_days int not null default 3,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, domain text, price numeric(14,2) not null, cycle cycle_t not null default 'monthly',
  next_billing date not null, account_id uuid references accounts(id) on delete set null,
  card_id uuid references cards(id) on delete set null, cancel_url text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (num_nonnulls(account_id, card_id) <= 1)
);
create table recurring_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, amount numeric(14,2) not null, day_of_month int not null check (day_of_month between 1 and 31),
  account_id uuid references accounts(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, card_id uuid references cards(id) on delete set null,
  total numeric(14,2) not null, months int not null, paid_months int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table budgets (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null, monthly_limit numeric(14,2) not null,
  primary key (user_id, category)
);

-- derived balances (never store a mutable balance)
create view account_balances with (security_invoker = true) as
select a.*, a.opening_balance
  + coalesce((select sum(amount) from transactions t where t.src_account_id = a.id and t.type = 'income'),0)
  - coalesce((select sum(amount) from transactions t where t.src_account_id = a.id and t.type in ('expense','transfer')),0)
  + coalesce((select sum(amount) from transactions t where t.to_account_id = a.id and t.type = 'transfer'),0) as balance
from accounts a;
create view card_usage with (security_invoker = true) as
select c.*, greatest(0, c.opening_used
  + coalesce((select sum(amount) from transactions t where t.src_card_id = c.id and t.type = 'expense'),0)
  - coalesce((select sum(amount) from transactions t where t.src_card_id = c.id and t.type = 'income'),0)
  - coalesce((select sum(amount) from transactions t where t.to_card_id = c.id and t.type = 'transfer'),0)) as used
from cards c;

-- ───────── assets / home ─────────
create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, kind text, brand text, model text, price numeric(14,2), purchased_on date, store text,
  serial text, warranty_until date, sold boolean not null default false, note text,
  image_path text, receipt_path text, purchase_txn_id uuid references transactions(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table properties (   -- one row per user in v1 (UI shows a single home)
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, kind text, monthly_rent numeric(14,2) default 0, since date, size text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table home_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, every_months int not null default 6, last_done date, next_due date not null, cost numeric(14,2) default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table projects (     -- renovation / construction
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, kind text, status text not null default 'in_progress', start_on date, end_on date,
  budget numeric(14,2) default 0, note text, phases text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table project_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  date date not null, shop text, phase text, note text,
  items jsonb not null default '[]',   -- [{name, qty, price}]
  attachment_path text, created_at timestamptz not null default now()
);

-- ───────── vehicles ─────────
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind vehicle_kind not null default 'car', brand text, model text, year int, plate text, vin text, color text,
  purchased_on date, price numeric(14,2), mileage int not null default 0, service_every_km int not null default 5000,
  insurance_company text, insurance_policy text, insurance_premium numeric(14,2), insurance_expiry date,
  prb_premium numeric(14,2), prb_expiry date, tax_premium numeric(14,2), tax_expiry date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table vehicle_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  category text, name text not null, date date not null, mileage int, cost numeric(14,2) not null default 0,
  provider text, note text, items jsonb not null default '[]', receipt_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  date date not null, mileage int not null, liters numeric(7,2) not null, price_per_l numeric(7,2), total numeric(14,2) not null,
  created_at timestamptz not null default now()
);

-- ───────── documents / tasks ─────────
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, type text, expiry date, related text, related_asset_id uuid references assets(id) on delete set null,
  related_vehicle_id uuid references vehicles(id) on delete set null, file_path text, note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, due date, priority task_pri not null default 'medium', related text,
  done boolean not null default false, done_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ───────── trips & split ─────────
create table friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, color text not null default '#3E82CF'
);
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, start_on date, end_on date, currency text not null default 'THB', rate numeric(12,6) not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table trip_members (   -- friend_id null = the owner ("ฉัน")
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  friend_id uuid references friends(id) on delete cascade,
  unique nulls not distinct (trip_id, friend_id)
);
create table trip_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null, category text, date date, split_mode split_mode not null default 'equal',
  amount numeric(14,2) not null,                         -- trip currency; for 'items' = sum(items)
  paid_by uuid not null references trip_members(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table trip_expense_items (       -- split_mode = 'items'
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_id uuid not null references trip_expenses(id) on delete cascade,
  name text not null, price numeric(14,2) not null, people uuid[] not null default '{}'   -- trip_members.id
);
create table trip_expense_shares (      -- materialised on every write: who owes how much for this expense
  expense_id uuid not null references trip_expenses(id) on delete cascade,
  member_id uuid not null references trip_members(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  amount numeric(14,2) not null, primary key (expense_id, member_id)
);
create table trip_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  from_member uuid not null references trip_members(id), to_member uuid not null references trip_members(id),
  amount numeric(14,2) not null, date date not null, txn_id uuid references transactions(id) on delete set null
);

-- ───────── notifications ─────────
create table notification_acks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  noti_id text not null,              -- '<key>@<date>' e.g. 'bill:<uuid>@2026-10-05'
  acked_on date not null default current_date, primary key (user_id, noti_id)
);
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique, p256dh text not null, auth text not null, created_at timestamptz not null default now()
);

-- ───────── triggers + RLS (applied to every table with user_id) ─────────
do $$ declare t text; begin
  for t in select table_name from information_schema.columns
           where table_schema='public' and column_name='user_id'
             and table_name in (select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE')
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create index if not exists %I on public.%I(user_id)', t||'_user_idx', t);
  end loop;
  for t in select table_name from information_schema.columns where table_schema='public' and column_name='updated_at'
             and table_name in (select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE')
  loop execute format('create trigger set_updated_at before update on public.%I for each row execute function set_updated_at()', t); end loop;
end $$;

-- auto-create profile + default cash account on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(user_id, display_name) values (new.id, split_part(new.email,'@',1));
  insert into accounts(user_id, name, type, bank) values (new.id, 'เงินสด', 'cash', 'cash');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ───────── storage ─────────
insert into storage.buckets(id, name, public) values ('files','files', false) on conflict do nothing;
create policy "own files read"   on storage.objects for select to authenticated using (bucket_id='files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files write"  on storage.objects for insert to authenticated with check (bucket_id='files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files update" on storage.objects for update to authenticated using (bucket_id='files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete to authenticated using (bucket_id='files' and (storage.foldername(name))[1] = auth.uid()::text);
-- path convention: files/<user_id>/<kind>/<uuid>.<ext>   kind = receipts | docs | assets | slips
