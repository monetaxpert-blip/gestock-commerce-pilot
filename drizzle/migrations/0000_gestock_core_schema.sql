create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id,
    coalesce(left(new.raw_user_meta_data->>'full_name', 120), left(new.raw_user_meta_data->>'name', 120), ''),
    left(new.raw_user_meta_data->>'phone', 30))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  address text check (address is null or char_length(address) <= 200),
  city text check (city is null or char_length(city) <= 80),
  sector text check (sector is null or char_length(sector) <= 60),
  timezone text not null default 'Africa/Dakar',
  allow_negative_stock boolean not null default false,
  receipt_footer text check (receipt_footer is null or char_length(receipt_footer) <= 300),
  plan text not null default 'trial' check (plan in ('trial','active','suspended')),
  trial_ends_at timestamptz not null,
  subscription_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null unique,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create or replace function public.is_shop_member(_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_members where shop_id = _shop and user_id = auth.uid())
$$;
create or replace function public.shop_is_writable(_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shops s where s.id = _shop and (
      (s.plan = 'trial' and now() < s.trial_ends_at) or
      (s.plan = 'active' and (s.subscription_ends_at is null or now() < s.subscription_ends_at))))
$$;
create or replace function public.can_write_shop(_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_shop_member(_shop) and public.shop_is_writable(_shop)
$$;

grant select on public.shops to authenticated;
grant update (name, phone, address, city, sector, allow_negative_stock, receipt_footer) on public.shops to authenticated;
grant all on public.shops to service_role;
alter table public.shops enable row level security;
create policy "shops_select_member" on public.shops for select to authenticated using (public.is_shop_member(id));
create policy "shops_update_member" on public.shops for update to authenticated using (public.can_write_shop(id)) with check (public.can_write_shop(id));
create trigger shops_touch before update on public.shops for each row execute function public.touch_updated_at();

grant select on public.shop_members to authenticated;
grant all on public.shop_members to service_role;
alter table public.shop_members enable row level security;
create policy "members_select_own_shop" on public.shop_members for select to authenticated using (public.is_shop_member(shop_id));

create table public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  requested_by uuid not null default auth.uid(),
  contact_phone text not null check (char_length(contact_phone) between 6 and 30),
  message text check (message is null or char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending','processed')),
  created_at timestamptz not null default now()
);
grant select on public.subscription_requests to authenticated;
grant insert (shop_id, contact_phone, message) on public.subscription_requests to authenticated;
grant all on public.subscription_requests to service_role;
alter table public.subscription_requests enable row level security;
create policy "subreq_select_member" on public.subscription_requests for select to authenticated using (public.is_shop_member(shop_id));
create policy "subreq_insert_member" on public.subscription_requests for insert to authenticated with check (public.is_shop_member(shop_id) and requested_by = auth.uid());

create table public.document_counters (
  shop_id uuid not null references public.shops(id) on delete cascade,
  doc_type text not null,
  year int not null,
  last_value int not null default 0,
  primary key (shop_id, doc_type, year)
);
grant all on public.document_counters to service_role;
alter table public.document_counters enable row level security;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  parent_id uuid references public.categories(id) on delete restrict,
  created_at timestamptz not null default now()
);
create unique index categories_unique_name on public.categories (shop_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)));
create index categories_parent_idx on public.categories (parent_id);
grant select, delete on public.categories to authenticated;
grant insert (shop_id, name, parent_id), update (name, parent_id) on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "cat_select" on public.categories for select to authenticated using (public.is_shop_member(shop_id));
create policy "cat_insert" on public.categories for insert to authenticated with check (public.can_write_shop(shop_id));
create policy "cat_update" on public.categories for update to authenticated using (public.can_write_shop(shop_id)) with check (public.can_write_shop(shop_id));
create policy "cat_delete" on public.categories for delete to authenticated using (public.can_write_shop(shop_id));

create or replace function public.categories_validate() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  new.name := btrim(new.name);
  if new.parent_id is not null then
    if new.parent_id = new.id then raise exception 'Une catégorie ne peut pas être sa propre parente.' using errcode = 'GS422'; end if;
    select shop_id, parent_id into p from public.categories where id = new.parent_id;
    if not found or p.shop_id <> new.shop_id then raise exception 'Catégorie parente introuvable.' using errcode = 'GS404'; end if;
    if p.parent_id is not null then raise exception 'Deux niveaux de catégories au maximum.' using errcode = 'GS422'; end if;
    if tg_op = 'UPDATE' and exists (select 1 from public.categories where parent_id = new.id) then
      raise exception 'Cette catégorie contient des sous-catégories.' using errcode = 'GS422';
    end if;
  end if;
  return new;
end $$;
create trigger categories_validate before insert or update on public.categories for each row execute function public.categories_validate();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  category_id uuid references public.categories(id) on delete restrict,
  description text check (description is null or char_length(description) <= 1000),
  base_unit text not null check (base_unit in ('piece','paire','kg','g','litre','ml','metre','paquet','sachet','boite','bouteille','carton','sac')),
  allow_decimal boolean generated always as (base_unit in ('kg','g','litre','ml','metre')) stored,
  is_stocked boolean not null default true,
  has_variants boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_shop_idx on public.products (shop_id);
create index products_category_idx on public.products (category_id);
grant select on public.products to authenticated;
grant update (name, category_id, description, archived_at) on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "prd_select" on public.products for select to authenticated using (public.is_shop_member(shop_id));
create policy "prd_update" on public.products for update to authenticated using (public.can_write_shop(shop_id)) with check (public.can_write_shop(shop_id));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create or replace function public.products_validate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.name := btrim(new.name);
  if new.category_id is not null and not exists (select 1 from public.categories where id = new.category_id and shop_id = new.shop_id) then
    raise exception 'Catégorie introuvable.' using errcode = 'GS404';
  end if;
  return new;
end $$;
create trigger products_validate before insert or update on public.products for each row execute function public.products_validate();

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_name text not null default '' check (char_length(variant_name) <= 80),
  sku text not null check (char_length(btrim(sku)) between 1 and 40),
  barcode text check (barcode is null or char_length(barcode) between 1 and 40),
  price_retail bigint not null check (price_retail >= 0 and price_retail <= 1000000000000),
  price_semi bigint check (price_semi is null or price_semi >= 0),
  price_wholesale bigint check (price_wholesale is null or price_wholesale >= 0),
  fixed_cost bigint check (fixed_cost is null or fixed_cost >= 0),
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  stock_qty numeric(14,3) not null default 0,
  avg_cost numeric(16,4) not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index articles_sku_unique on public.articles (shop_id, lower(sku));
create unique index articles_barcode_unique on public.articles (shop_id, barcode) where barcode is not null;
create unique index articles_variant_unique on public.articles (product_id, lower(variant_name));
create index articles_shop_idx on public.articles (shop_id);
grant select on public.articles to authenticated;
grant update (variant_name, sku, barcode, price_retail, price_semi, price_wholesale, fixed_cost, low_stock_threshold, archived_at) on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;
create policy "art_select" on public.articles for select to authenticated using (public.is_shop_member(shop_id));
create policy "art_update" on public.articles for update to authenticated using (public.can_write_shop(shop_id)) with check (public.can_write_shop(shop_id));
create trigger articles_touch before update on public.articles for each row execute function public.touch_updated_at();

create or replace function public.articles_normalize() returns trigger
language plpgsql set search_path = public as $$
begin
  new.sku := upper(btrim(new.sku));
  new.variant_name := btrim(coalesce(new.variant_name, ''));
  new.barcode := nullif(btrim(coalesce(new.barcode, '')), '');
  return new;
end $$;
create trigger articles_normalize before insert or update on public.articles for each row execute function public.articles_normalize();

create table public.packagings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  factor numeric(14,3) not null check (factor > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index packagings_unique on public.packagings (product_id, lower(btrim(name))) where archived_at is null;
create index packagings_shop_idx on public.packagings (shop_id);
grant select on public.packagings to authenticated;
grant insert (shop_id, product_id, name, factor), update (name, factor, archived_at) on public.packagings to authenticated;
grant all on public.packagings to service_role;
alter table public.packagings enable row level security;
create policy "pkg_select" on public.packagings for select to authenticated using (public.is_shop_member(shop_id));
create policy "pkg_insert" on public.packagings for insert to authenticated with check (public.can_write_shop(shop_id));
create policy "pkg_update" on public.packagings for update to authenticated using (public.can_write_shop(shop_id)) with check (public.can_write_shop(shop_id));

create or replace function public.packagings_validate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.name := btrim(new.name);
  if not exists (select 1 from public.products where id = new.product_id and shop_id = new.shop_id) then
    raise exception 'Produit introuvable.' using errcode = 'GS404';
  end if;
  return new;
end $$;
create trigger packagings_validate before insert or update on public.packagings for each row execute function public.packagings_validate();

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text not null check (char_length(phone) between 6 and 20),
  email text check (email is null or char_length(email) <= 255),
  address text check (address is null or char_length(address) <= 200),
  price_tier text not null default 'retail' check (price_tier in ('retail','semi','wholesale')),
  note text check (note is null or char_length(note) <= 500),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, phone)
);
grant select on public.customers to authenticated;
grant insert (shop_id, name, phone, email, address, price_tier, note), update (name, phone, email, address, price_tier, note, archived_at) on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "cus_select" on public.customers for select to authenticated using (public.is_shop_member(shop_id));
create policy "cus_insert" on public.customers for insert to authenticated with check (public.can_write_shop(shop_id));
create policy "cus_update" on public.customers for update to authenticated using (public.can_write_shop(shop_id)) with check (public.can_write_shop(shop_id));
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();

create or replace function public.customers_normalize() returns trigger
language plpgsql set search_path = public as $$
begin
  new.name := btrim(new.name);
  new.phone := regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g');
  new.email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  if char_length(new.phone) < 6 then raise exception 'Numéro de téléphone invalide.' using errcode = 'GS422'; end if;
  return new;
end $$;
create trigger customers_normalize before insert or update on public.customers for each row execute function public.customers_normalize();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'en_attente' check (status in ('en_attente','confirmee','preparee','livree','annulee')),
  price_tier text not null default 'retail' check (price_tier in ('retail','semi','wholesale')),
  expected_date date,
  note text check (note is null or char_length(note) <= 500),
  total bigint not null default 0,
  deposit_total bigint not null default 0,
  retained_amount bigint not null default 0,
  sale_id uuid,
  operation_key uuid not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  prepared_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  unique (shop_id, number),
  unique (shop_id, operation_key)
);
create index orders_shop_idx on public.orders (shop_id, created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  product_name text not null,
  variant_name text not null default '',
  packaging_id uuid,
  packaging_name text not null,
  factor numeric(14,3) not null,
  quantity numeric(14,3) not null check (quantity > 0),
  base_quantity numeric(14,3) not null,
  unit_price bigint not null,
  line_gross bigint not null,
  line_discount bigint not null default 0,
  line_total bigint not null
);
create index order_lines_order_idx on public.order_lines (order_id);
create index order_lines_article_idx on public.order_lines (article_id);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  number text not null,
  customer_id uuid references public.customers(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  status text not null default 'validated' check (status in ('validated','cancelled')),
  price_tier text not null default 'retail' check (price_tier in ('retail','semi','wholesale')),
  subtotal bigint not null default 0,
  discount_total bigint not null default 0,
  total bigint not null default 0,
  cost_total bigint not null default 0,
  margin bigint not null default 0,
  amount_paid bigint not null default 0,
  amount_due bigint not null default 0,
  has_unreliable_margin boolean not null default false,
  note text check (note is null or char_length(note) <= 500),
  operation_key uuid not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid,
  cancel_reason text,
  unique (shop_id, number),
  unique (shop_id, operation_key)
);
create index sales_shop_date_idx on public.sales (shop_id, created_at desc);
create index sales_customer_idx on public.sales (customer_id);
create index sales_order_idx on public.sales (order_id);
alter table public.orders add constraint orders_sale_fk foreign key (sale_id) references public.sales(id) on delete set null;

create table public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  product_name text not null,
  variant_name text not null default '',
  packaging_id uuid,
  packaging_name text not null,
  factor numeric(14,3) not null,
  quantity numeric(14,3) not null check (quantity > 0),
  base_quantity numeric(14,3) not null,
  unit_price bigint not null,
  line_gross bigint not null,
  line_discount bigint not null default 0,
  global_discount_share bigint not null default 0,
  line_net bigint not null,
  unit_cost numeric(16,4) not null default 0,
  line_cost bigint not null default 0,
  line_margin bigint not null default 0
);
create index sale_lines_sale_idx on public.sale_lines (sale_id);
create index sale_lines_article_idx on public.sale_lines (article_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  direction text not null check (direction in ('in','out')),
  kind text not null check (kind in ('sale','settlement','deposit','refund')),
  method text not null check (method in ('cash','wave','orange_money','free_money','card','transfer','other')),
  amount bigint not null check (amount > 0),
  note text check (note is null or char_length(note) <= 300),
  operation_key uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);
create unique index payments_opkey_unique on public.payments (shop_id, operation_key) where operation_key is not null;
create index payments_shop_date_idx on public.payments (shop_id, created_at desc);
create index payments_sale_idx on public.payments (sale_id);
create index payments_order_idx on public.payments (order_id);
create index payments_customer_idx on public.payments (customer_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  number text not null,
  supplier_name text check (supplier_name is null or char_length(supplier_name) <= 120),
  received_at date not null,
  note text check (note is null or char_length(note) <= 500),
  total_cost bigint not null default 0,
  operation_key uuid not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (shop_id, number),
  unique (shop_id, operation_key)
);
create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  product_name text not null,
  variant_name text not null default '',
  packaging_id uuid,
  packaging_name text not null,
  factor numeric(14,3) not null,
  quantity numeric(14,3) not null check (quantity > 0),
  base_quantity numeric(14,3) not null,
  unit_cost bigint not null check (unit_cost >= 0),
  line_total bigint not null
);
create index purchase_lines_purchase_idx on public.purchase_lines (purchase_id);
create index purchase_lines_article_idx on public.purchase_lines (article_id);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  type text not null check (type in ('initial','purchase','sale','sale_cancel','adjustment')),
  quantity numeric(14,3) not null check (quantity <> 0),
  unit_cost numeric(16,4) not null default 0,
  value bigint not null default 0,
  stock_after numeric(14,3) not null,
  avg_cost_after numeric(16,4) not null,
  reason text,
  note text,
  reference_type text,
  reference_id uuid,
  reference_number text,
  operation_key uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);
create unique index movements_opkey_unique on public.stock_movements (shop_id, operation_key) where operation_key is not null;
create index movements_shop_date_idx on public.stock_movements (shop_id, created_at desc);
create index movements_article_idx on public.stock_movements (article_id, created_at desc);

grant select on public.orders, public.order_lines, public.sales, public.sale_lines, public.payments, public.purchases, public.purchase_lines, public.stock_movements to authenticated;
grant all on public.orders, public.order_lines, public.sales, public.sale_lines, public.payments, public.purchases, public.purchase_lines, public.stock_movements to service_role;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.sales enable row level security;
alter table public.sale_lines enable row level security;
alter table public.payments enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_lines enable row level security;
alter table public.stock_movements enable row level security;
create policy "orders_select_member" on public.orders for select to authenticated using (public.is_shop_member(shop_id));
create policy "order_lines_select_member" on public.order_lines for select to authenticated using (public.is_shop_member(shop_id));
create policy "sales_select_member" on public.sales for select to authenticated using (public.is_shop_member(shop_id));
create policy "sale_lines_select_member" on public.sale_lines for select to authenticated using (public.is_shop_member(shop_id));
create policy "payments_select_member" on public.payments for select to authenticated using (public.is_shop_member(shop_id));
create policy "purchases_select_member" on public.purchases for select to authenticated using (public.is_shop_member(shop_id));
create policy "purchase_lines_select_member" on public.purchase_lines for select to authenticated using (public.is_shop_member(shop_id));
create policy "movements_select_member" on public.stock_movements for select to authenticated using (public.is_shop_member(shop_id));

create view public.article_stock with (security_invoker = true) as
select
  a.id, a.shop_id, a.product_id, a.variant_name, a.sku, a.barcode,
  a.price_retail, a.price_semi, a.price_wholesale, a.fixed_cost,
  a.low_stock_threshold, a.stock_qty, a.avg_cost, a.archived_at,
  p.name as product_name, p.base_unit, p.allow_decimal, p.is_stocked, p.has_variants,
  p.category_id, p.archived_at as product_archived_at,
  coalesce(e.engaged, 0)::numeric(14,3) as engaged_qty,
  (a.stock_qty - coalesce(e.engaged, 0))::numeric(14,3) as available_qty
from public.articles a
join public.products p on p.id = a.product_id
left join (
  select ol.article_id, sum(ol.base_quantity) as engaged
  from public.order_lines ol join public.orders o on o.id = ol.order_id
  where o.status in ('confirmee','preparee')
  group by ol.article_id
) e on e.article_id = a.id;
grant select on public.article_stock to authenticated;

create view public.customer_balances with (security_invoker = true) as
select
  c.id as customer_id, c.shop_id,
  coalesce(sum(s.amount_due) filter (where s.status = 'validated'), 0)::bigint as receivable,
  count(s.id) filter (where s.status = 'validated')::int as sales_count,
  coalesce(sum(s.total) filter (where s.status = 'validated'), 0)::bigint as total_spent,
  max(s.created_at) filter (where s.status = 'validated') as last_sale_at
from public.customers c
left join public.sales s on s.customer_id = c.id
group by c.id, c.shop_id;
grant select on public.customer_balances to authenticated;