-- ============================================================================
--  X-Shop — Schéma de la base PostgreSQL (Supabase)
--  À exécuter UNE FOIS dans Supabase → SQL Editor → New query → Run.
--  Les colonnes sont nommées en camelCase (entre guillemets) pour correspondre
--  exactement aux données attendues par l'application (aucune transformation).
-- ============================================================================

-- --- Tables -----------------------------------------------------------------

create table if not exists public.app_users (
  id        bigint generated always as identity primary key,
  username  text,
  password  text,
  name      text,
  role      text
);

create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text,
  category    text,
  price       numeric default 0,
  stock       integer default 0,
  image       text,
  photo       text,
  "createdAt" date default current_date
);

create table if not exists public.sales (
  id              bigint generated always as identity primary key,
  items           jsonb default '[]'::jsonb,
  total           numeric default 0,
  "paidAmount"    numeric default 0,
  "paymentStatus" text default 'paid',
  "customerName"  text,
  "customerPhone" text,
  "timestamp"     timestamptz default now()
);

create table if not exists public.rental_units (
  id            bigint generated always as identity primary key,
  type          text,
  name          text,
  price         numeric default 0,
  capacity      integer default 0,
  description   text,
  status        text default 'libre',
  "createdAt"   date default current_date
);

create table if not exists public.rentals (
  id              bigint generated always as identity primary key,
  "unitId"        bigint,
  "unitName"      text,
  "unitType"      text,
  "customerName"  text,
  "customerPhone" text,
  "startDate"     date,
  "endDate"       date,
  duration        integer default 1,
  "unitPrice"     numeric default 0,
  total           numeric default 0,
  "paidAmount"    numeric default 0,
  "paymentStatus" text default 'paid',
  status          text default 'active',
  "timestamp"     timestamptz default now()
);

create table if not exists public.settings (
  key   text primary key,
  value text
);

-- --- Accès (clé anon) : RLS désactivé + privilèges accordés -----------------
-- NB : comme l'app actuelle, l'accès est ouvert via la clé publique (anon).
-- Simple et fonctionnel pour un outil interne. On pourra durcir plus tard (RLS).

alter table public.app_users   disable row level security;
alter table public.products    disable row level security;
alter table public.sales       disable row level security;
alter table public.rental_units disable row level security;
alter table public.rentals     disable row level security;
alter table public.settings    disable row level security;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- --- Données de départ (seed) ----------------------------------------------
-- Idempotent : ne réinsère pas si déjà présent.

insert into public.app_users (username, password, name, role)
select 'admin', 'password', 'Administrateur Principal', 'admin'
where not exists (select 1 from public.app_users where username = 'admin');

-- Produits de consommation
insert into public.products (name, category, price, stock, image)
select v.name, v.category, v.price, v.stock, v.image
from (values
  ('Eau minérale 1.5L','Boissons',500,120,'💧'),
  ('Coca-Cola 33cl','Boissons',400,200,'🥤'),
  ('Jus d''orange 1L','Boissons',1000,60,'🧃'),
  ('Café soluble 100g','Alimentation',2000,35,'☕'),
  ('Pain de mie','Alimentation',800,30,'🍞'),
  ('Riz parfumé 5kg','Épicerie',4500,25,'🍚'),
  ('Huile végétale 1L','Épicerie',1500,40,'🛢️'),
  ('Spaghetti 500g','Épicerie',600,60,'🍝'),
  ('Sucre en poudre 1kg','Épicerie',700,80,'🧂'),
  ('Lait en poudre 400g','Frais',2500,45,'🥛'),
  ('Œufs x30','Frais',3000,15,'🥚'),
  ('Yaourt nature x4','Frais',1500,40,'🍶'),
  ('Savon de Marseille','Hygiène',600,90,'🧼'),
  ('Dentifrice','Hygiène',1200,50,'🪥'),
  ('Shampoing 400ml','Hygiène',2800,30,'🧴'),
  ('Lessive détergent 1kg','Entretien',3500,20,'🧺'),
  ('Eau de javel 1L','Entretien',900,55,'🧽'),
  ('Biscuits chocolat','Snacks',500,150,'🍪'),
  ('Chips 100g','Snacks',700,100,'🥔'),
  ('Chocolat tablette','Snacks',1000,70,'🍫'),
  ('Sandwich jambon-beurre','Sandwichs',1000,40,'🥪'),
  ('Sandwich poulet crudités','Sandwichs',1500,35,'🥪'),
  ('Sandwich thon','Sandwichs',1500,30,'🥪'),
  ('Sandwich œuf-mayo','Sandwichs',1000,30,'🥪'),
  ('Sandwich fromage','Sandwichs',1000,35,'🧀'),
  ('Sandwich steak haché','Sandwichs',2000,25,'🍔'),
  ('Hot-dog','Sandwichs',1500,30,'🌭'),
  ('Wrap poulet','Sandwichs',1800,25,'🌯'),
  ('Panini mixte','Sandwichs',1800,25,'🥪'),
  ('Hamburger maison','Sandwichs',2500,20,'🍔')
) as v(name, category, price, stock, image)
where not exists (select 1 from public.products p where p.name = v.name);

-- Unités de location (appartements + salles d'activité)
insert into public.rental_units (type, name, price, capacity, description)
select v.type, v.name, v.price, v.capacity, v.description
from (values
  ('appartement','Appartement A1 — Studio',15000,2,'Studio meublé, 1 chambre, cuisine équipée'),
  ('appartement','Appartement A2 — F2',25000,4,'2 chambres, salon, balcon'),
  ('appartement','Appartement A3 — F3',35000,6,'3 chambres, salon, 2 salles de bain'),
  ('appartement','Appartement A4 — Suite',50000,2,'Suite de luxe, vue mer, climatisée'),
  ('salle','Salle d''activité — Conférence',40000,100,'Salle de conférence, projecteur, sonorisation'),
  ('salle','Salle d''activité — Réunion',20000,30,'Salle de réunion climatisée, écran'),
  ('salle','Salle d''activité — Fête',75000,200,'Grande salle de réception, scène, cuisine')
) as v(type, name, price, capacity, description)
where not exists (select 1 from public.rental_units u where u.name = v.name);

-- Réglages (prix d'entrée piscine)
insert into public.settings (key, value)
select 'piscinePrice', '3000'
where not exists (select 1 from public.settings where key = 'piscinePrice');
