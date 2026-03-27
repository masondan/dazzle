-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Inventory table
create table inventory (
  id text primary key,
  name text not null,
  category text default '',
  supplier text,
  wholesale_cost numeric default 0,
  retail_price numeric default 0,
  stock text default 'Dropship',
  advertised_on jsonb default '[]',
  notes text default '',
  date_entered text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders table
create table orders (
  id text primary key,
  date text,
  customer_name text not null,
  customer_phone text,
  addresses jsonb default '[]',
  source text default '',
  notes text default '',
  items jsonb default '[]',
  payment_method text default 'Bank transfer',
  status text default 'lead',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (required by Supabase)
alter table inventory enable row level security;
alter table orders enable row level security;

-- Allow public access via anon key (this is a personal app, no auth needed)
create policy "Allow all access to inventory" on inventory for all using (true) with check (true);
create policy "Allow all access to orders" on orders for all using (true) with check (true);

-- Auto-update the updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inventory_updated_at before update on inventory
  for each row execute function update_updated_at();

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- Migration: add category column
-- Run this if tables already exist:
-- alter table inventory add column if not exists category text default '';

-- alter table orders add column if not exists payment_method text default 'Bank transfer';

-- =============================================
-- NEW TABLES (run in Supabase SQL Editor)
-- =============================================

-- Costs table
create table costs (
  id text primary key,
  date text,
  description text default '',
  supplier text default '',
  amount numeric default 0,
  cost_type text default 'other',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table costs enable row level security;
create policy "Allow all access to costs" on costs for all using (true) with check (true);
create trigger costs_updated_at before update on costs
  for each row execute function update_updated_at();

-- Suppliers table
create table suppliers (
  id text primary key,
  name text not null,
  address text default '',
  phones jsonb default '[]',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table suppliers enable row level security;
create policy "Allow all access to suppliers" on suppliers for all using (true) with check (true);
create trigger suppliers_updated_at before update on suppliers
  for each row execute function update_updated_at();
