-- Dotty. Webshop Database Schema
-- All prices in NOK øre (1 kr = 100 øre), includes 25% MVA

-- Collections (must be created first due to FK)
create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  slug text unique not null,
  price integer not null, -- NOK øre, includes MVA
  image_url text not null,
  image_path text not null, -- Supabase storage path
  product_type text default 'original' check (product_type in ('original', 'print')),
  stock_quantity integer, -- null for originals (one-of-a-kind)
  collection_id uuid references collections(id) on delete set null,
  is_available boolean default true,
  is_featured boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  items jsonb not null, -- [{product_id, title, price, quantity, image_url}]
  subtotal integer not null,
  discount_code text,
  discount_amount integer default 0,
  total integer not null,
  payment_provider text check (payment_provider in ('stripe', 'vipps')),
  payment_session_id text,
  status text default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered')),
  tracking_carrier text,
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Discount Codes
create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent integer check (discount_percent > 0 and discount_percent <= 100),
  discount_amount integer check (discount_amount > 0), -- NOK øre
  is_active boolean default true,
  uses_remaining integer, -- null = unlimited
  expires_at timestamptz,
  created_at timestamptz default now(),
  constraint discount_type_check check (
    (discount_percent is not null and discount_amount is null) or
    (discount_percent is null and discount_amount is not null)
  )
);

-- Cart Reservations (15-minute soft lock)
create table cart_reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  session_id text not null,
  quantity integer default 1,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Newsletter Subscribers
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now(),
  resend_synced boolean default false
);

-- Indexes
create index idx_products_slug on products(slug);
create index idx_products_collection on products(collection_id);
create index idx_products_available on products(is_available);
create index idx_products_featured on products(is_featured) where is_featured = true;
create index idx_collections_slug on collections(slug);
create index idx_orders_status on orders(status);
create index idx_orders_email on orders(customer_email);
create index idx_reservations_expires on cart_reservations(expires_at);
create index idx_reservations_session on cart_reservations(session_id);
create index idx_discount_codes_code on discount_codes(code);

-- RLS Policies

-- Enable RLS
alter table products enable row level security;
alter table collections enable row level security;
alter table orders enable row level security;
alter table discount_codes enable row level security;
alter table cart_reservations enable row level security;
alter table newsletter_subscribers enable row level security;

-- Products: Public read
create policy "Products are viewable by everyone"
  on products for select
  using (true);

-- Collections: Public read
create policy "Collections are viewable by everyone"
  on collections for select
  using (true);

-- Discount codes: Public can validate codes
create policy "Active discount codes are viewable"
  on discount_codes for select
  using (is_active = true and (expires_at is null or expires_at > now()));

-- Cart reservations: Users can manage their own reservations
create policy "Users can view own reservations"
  on cart_reservations for select
  using (true);

create policy "Users can create reservations"
  on cart_reservations for insert
  with check (true);

create policy "Users can delete own reservations"
  on cart_reservations for delete
  using (true);

-- Newsletter: Public can subscribe
create policy "Anyone can subscribe to newsletter"
  on newsletter_subscribers for insert
  with check (true);

-- Orders: No public access (server-side only with service role)

-- Updated at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to products
create trigger products_updated_at
  before update on products
  for each row
  execute function update_updated_at();

-- Apply trigger to orders
create trigger orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at();

-- Function to clean up expired reservations
create or replace function cleanup_expired_reservations()
returns void as $$
begin
  delete from cart_reservations where expires_at < now();
end;
$$ language plpgsql;

-- Storage bucket for artwork (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('artwork', 'artwork', true);
