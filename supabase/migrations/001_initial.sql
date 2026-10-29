-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text default 'user' check (role in ('user', 'owner', 'admin')),
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id serial primary key,
  name text not null,
  slug text unique not null,
  icon text,
  color text
);

-- Businesses
create table businesses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id),
  name text not null,
  slug text unique not null,
  description text,
  category_id int references categories(id),
  address text,
  phone text,
  whatsapp text,
  city text default 'Tierra Blanca',
  state text default 'Veracruz',
  lat numeric(10,7),
  lng numeric(10,7),
  cover_image text,
  is_active boolean default true,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Business hours
create table business_hours (
  id serial primary key,
  business_id uuid references businesses(id) on delete cascade,
  day_of_week int check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean default false
);

-- Photos
create table photos (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references businesses(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- Seed categories
insert into categories (name, slug, icon, color) values
('Comida y Restaurantes', 'comida', 'UtensilsCrossed', '#F97316'),
('Salud y Belleza', 'belleza', 'Scissors', '#EC4899'),
('Salud Médica', 'salud', 'Heart', '#EF4444'),
('Abarrotes y Tiendas', 'tiendas', 'ShoppingBag', '#8B5CF6'),
('Mecánica y Autos', 'autos', 'Wrench', '#6B7280'),
('Educación', 'educacion', 'BookOpen', '#3B82F6'),
('Entretenimiento', 'entretenimiento', 'Music', '#F59E0B'),
('Servicios del Hogar', 'hogar', 'Home', '#10B981');
