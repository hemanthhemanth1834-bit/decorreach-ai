-- DecorReach AI — Supabase/Postgres schema
-- Run in Supabase SQL editor. App works without it (in-memory demo mode).

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  product_description text not null default '',
  website text default '',
  contact_name text default '',
  contact_email text default '',
  phone text default '',
  company_description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  location text not null,
  results int not null default 0,
  mode text not null default 'demo' check (mode in ('live','demo')),
  providers text[] default '{}',
  created_at timestamptz default now()
);
create index if not exists searches_created_idx on searches (created_at desc);

create table if not exists leads (
  id text primary key,
  name text not null,
  category text not null default '',
  address text,
  city text,
  state text,
  country text default 'United States',
  postal_code text,
  website text,
  phone text,
  email text,
  latitude double precision,
  longitude double precision,
  source text default 'DecorReach',
  source_url text,
  source_type text default 'demo' check (source_type in ('live','demo')),
  discovered_at timestamptz default now(),
  saved_at timestamptz default now()
);
create index if not exists leads_city_idx on leads (city);
create index if not exists leads_state_idx on leads (state);
create index if not exists leads_email_idx on leads (email);

create table if not exists campaigns (
  id text primary key,
  name text not null,
  product text default '',
  location text default '',
  subject text not null default '',
  body text not null default '',
  status text not null default 'Draft'
    check (status in ('Draft','Ready','Sending','Completed','Partially Sent','Failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists campaign_leads (
  campaign_id text references campaigns(id) on delete cascade,
  lead_id text references leads(id) on delete cascade,
  lead_name text default '',
  email text,
  status text default 'pending' check (status in ('pending','sent','failed','skipped')),
  provider_id text,
  error text,
  sent_at timestamptz,
  primary key (campaign_id, lead_id)
);

create table if not exists email_messages (
  id text primary key,
  to_email text not null,
  subject text not null,
  status text not null default 'pending',
  provider_id text,
  campaign_id text references campaigns(id) on delete set null,
  lead_id text references leads(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists email_messages_status_idx on email_messages (status);

create table if not exists provider_logs (
  id bigint generated always as identity primary key,
  provider text not null,
  operation text not null,
  ok boolean not null default true,
  message text,
  created_at timestamptz default now()
);

-- Row Level Security: enable and allow service-role full access (app uses server key only).
alter table profiles enable row level security;
alter table searches enable row level security;
alter table leads enable row level security;
alter table campaigns enable row level security;
alter table campaign_leads enable row level security;
alter table email_messages enable row level security;
alter table provider_logs enable row level security;
