-- MenuPilot AI — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- Supabase Auth handles the `auth.users` table automatically.
--
-- Structure: create ALL tables first, then add ALL policies.
-- This avoids "relation does not exist" errors when policies
-- cross-reference tables that haven't been created yet.

-- ═══════════════════════════════════════════════════
-- PHASE 1 — TABLE DEFINITIONS
-- ═══════════════════════════════════════════════════

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  city        text default 'Riyadh',
  country     text default 'Saudi Arabia',
  type        text default 'Seafood Restaurant',
  website     text default '',
  rent        numeric default 28000,
  waste_pct   numeric default 4,
  plan        text default 'Growth',
  created_at  timestamptz default now()
);

create table org_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        text default 'Manager', -- Owner, Manager, Accountant, Chef
  status      text default 'Invited', -- Active, Invited
  invited_at  timestamptz default now()
);

create table branches (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  name        text not null,
  sort_order  int default 0
);

create table menu_categories (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  name        text not null,
  sort_order  int default 0
);

create table suppliers (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organizations(id) on delete cascade not null,
  name          text not null,
  category      text default '',
  payment_terms text default 'Net 15',
  delivery_days text default '',
  rating        numeric default 4.5,
  created_at    timestamptz default now()
);

create table ingredients (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  supplier_id uuid references suppliers(id) on delete set null,
  name        text not null,
  unit        text default 'kg',   -- kg, g, L, ml, pc
  price       numeric not null,    -- per unit
  yield_pct   numeric default 1.0, -- 0–1
  is_estimate boolean default true,
  created_at  timestamptz default now()
);

create table ingredient_price_history (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid references ingredients(id) on delete cascade not null,
  price         numeric not null,
  recorded_at   date default current_date,
  source        text default 'manual' -- manual, invoice, import
);

create table menu_items (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references organizations(id) on delete cascade not null,
  name            text not null,
  category        text default 'General',
  description     text default '',
  price           numeric not null,
  labor_min       numeric default 5,
  packaging_cost  numeric default 1.5,
  monthly_sold    int default 0,
  delivery_share  numeric default 0.3,
  status          text default 'pending', -- pending, approved, extracted
  needs_reprice   boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table recipes (
  id             uuid primary key default gen_random_uuid(),
  menu_item_id   uuid references menu_items(id) on delete cascade not null,
  ingredient_id  uuid references ingredients(id) on delete cascade not null,
  quantity       numeric not null,
  unique (menu_item_id, ingredient_id)
);

create table employees (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  name        text not null,
  position    text default 'Staff',
  basic       numeric not null,
  housing     numeric default 0,
  transport   numeric default 300,
  food        numeric default 300,
  overtime    numeric default 0,
  gosi_rate   numeric default 0.02,
  visa_annual numeric default 170,
  iqama       numeric default 54,
  medical     numeric default 150,
  recruitment numeric default 160,
  is_saudi    boolean default false,
  created_at  timestamptz default now()
);

create table gov_fees (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  name        text not null,
  authority   text default '',
  amount      numeric not null,
  cycle       text default 'Annual',
  created_at  timestamptz default now()
);

create table hidden_costs (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade not null,
  name       text not null,
  group_name text default 'Operations',
  amount     numeric not null
);

create table delivery_apps (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade not null,
  name         text not null,
  commission   numeric default 25,
  marketing    numeric default 5,
  order_share  numeric default 33
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade not null,
  title      text not null,
  message    text not null,
  kind       text default 'info', -- info, warn, bad, good
  is_read    boolean default false,
  created_at timestamptz default now()
);

create table billing_invoices (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade not null,
  number     text not null,
  amount     numeric not null,
  status     text default 'Pending',
  issued_at  date default current_date
);

-- ═══════════════════════════════════════════════════
-- PHASE 2 — ENABLE RLS ON ALL TABLES
-- ═══════════════════════════════════════════════════

alter table organizations          enable row level security;
alter table org_members            enable row level security;
alter table branches               enable row level security;
alter table menu_categories        enable row level security;
alter table suppliers              enable row level security;
alter table ingredients            enable row level security;
alter table ingredient_price_history enable row level security;
alter table menu_items             enable row level security;
alter table recipes                enable row level security;
alter table employees              enable row level security;
alter table gov_fees               enable row level security;
alter table hidden_costs           enable row level security;
alter table delivery_apps          enable row level security;
alter table notifications          enable row level security;
alter table billing_invoices       enable row level security;

-- ═══════════════════════════════════════════════════
-- PHASE 3 — POLICIES
-- All tables now exist, so cross-table references work.
-- ═══════════════════════════════════════════════════

-- Helper: is the caller a member of this org?
-- Used inline below; no separate function needed.

create policy "Owner full access" on organizations
  for all using (auth.uid() = owner_id);

create policy "Owner manages members" on org_members
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Org access branches" on branches
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access categories" on menu_categories
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access suppliers" on suppliers
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access ingredients" on ingredients
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access price history" on ingredient_price_history
  for all using (
    ingredient_id in (
      select id from ingredients where org_id in (
        select id from organizations where owner_id = auth.uid()
        union
        select org_id from org_members where user_id = auth.uid() and status = 'Active'
      )
    )
  );

create policy "Org access menu items" on menu_items
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access recipes" on recipes
  for all using (
    menu_item_id in (
      select id from menu_items where org_id in (
        select id from organizations where owner_id = auth.uid()
        union
        select org_id from org_members where user_id = auth.uid() and status = 'Active'
      )
    )
  );

create policy "Org access employees" on employees
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access gov fees" on gov_fees
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access hidden costs" on hidden_costs
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access delivery apps" on delivery_apps
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Org access notifications" on notifications
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
    or org_id in (select org_id from org_members where user_id = auth.uid() and status = 'Active')
  );

create policy "Owner access invoices" on billing_invoices
  for all using (
    org_id in (select id from organizations where owner_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════
-- PHASE 3b — 2026-06 additions: rent term, utilities, extra fees
-- Safe to run on an existing database (idempotent).
-- ═══════════════════════════════════════════════════

alter table organizations add column if not exists rent_term  jsonb default '{"months":12}'::jsonb;
alter table organizations add column if not exists elec       jsonb default '{"included":true,"amt":0}'::jsonb;
alter table organizations add column if not exists water      jsonb default '{"included":true,"amt":0}'::jsonb;
alter table organizations add column if not exists eval_month text;
alter table organizations add column if not exists extra_fees jsonb default '[]'::jsonb;

-- ═══════════════════════════════════════════════════
-- PHASE 4 — VIEWS
-- ═══════════════════════════════════════════════════

create or replace view ingredient_with_supplier as
  select i.*, s.name as supplier_name
  from ingredients i
  left join suppliers s on i.supplier_id = s.id;

create or replace view menu_item_with_recipe as
  select
    m.*,
    json_agg(json_build_object(
      'ingredient_id', r.ingredient_id,
      'quantity',      r.quantity,
      'ing_name',      i.name,
      'ing_unit',      i.unit,
      'ing_price',     i.price,
      'ing_yield',     i.yield_pct,
      'is_estimate',   i.is_estimate
    )) filter (where r.id is not null) as recipe
  from menu_items m
  left join recipes r on r.menu_item_id = m.id
  left join ingredients i on i.id = r.ingredient_id
  group by m.id;
