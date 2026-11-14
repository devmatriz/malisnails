create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'reception', 'specialist');
create type public.appointment_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.sale_status as enum ('pending', 'partial', 'paid', 'refunded', 'cancelled');
create type public.payment_method as enum ('cash', 'transfer', 'card', 'mixed');
create type public.inventory_movement_type as enum ('in', 'out', 'adjustment');

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  role public.user_role not null default 'reception',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  birthday date,
  preferences text,
  allergies text,
  internal_notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  phone text,
  specialty text,
  commission_rate numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.employee_working_hours (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (employee_id, weekday, start_time, end_time),
  check (start_time < end_time)
);

create table public.employee_time_blocks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  base_price numeric(12,2) not null check (base_price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  online_booking_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  client_id uuid references public.clients(id) on delete restrict,
  employee_id uuid references public.employees(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.appointment_status not null default 'pending',
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  price numeric(12,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0)
);

create table public.public_bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  preferred_employee_id uuid references public.employees(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  client_email text,
  preferred_date date not null,
  preferred_time time not null,
  notes text,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  invoice_number text unique,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  status public.sale_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  method public.payment_method not null,
  amount numeric(12,2) not null check (amount > 0),
  reference text,
  paid_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  brand text,
  category text not null,
  unit text not null default 'unidad',
  current_stock numeric(12,2) not null default 0,
  minimum_stock numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  supplier text,
  public_visible boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type public.inventory_movement_type not null,
  quantity numeric(12,2) not null check (quantity > 0),
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index clients_phone_idx on public.clients(phone);
create index appointments_starts_at_idx on public.appointments(starts_at);
create index appointments_status_idx on public.appointments(status);
create index public_bookings_status_idx on public.public_bookings(status);
create index sales_created_at_idx on public.sales(created_at);
create index employee_working_hours_employee_idx on public.employee_working_hours(employee_id, weekday);
create index employee_time_blocks_date_idx on public.employee_time_blocks(block_date, employee_id);

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true;
$$;

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.employee_working_hours enable row level security;
alter table public.employee_time_blocks enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.public_bookings enable row level security;
alter table public.sales enable row level security;
alter table public.payments enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;

create policy "public can read active services"
on public.services for select
using (active = true and online_booking_enabled = true);

create policy "public can read active working hours"
on public.employee_working_hours for select
using (active = true);

create policy "public can read time blocks"
on public.employee_time_blocks for select
using (true);

create policy "public can create booking requests"
on public.public_bookings for insert
with check (status = 'pending');

create policy "staff can read branches"
on public.branches for select
to authenticated
using (public.current_user_role() is not null);

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "admin can manage profiles"
on public.profiles for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "staff can read operational tables"
on public.clients for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read employees" on public.employees for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read working hours" on public.employee_working_hours for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read time blocks" on public.employee_time_blocks for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read appointments" on public.appointments for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read appointment services" on public.appointment_services for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read bookings" on public.public_bookings for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read sales" on public.sales for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read payments" on public.payments for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read products" on public.products for select to authenticated using (public.current_user_role() is not null);
create policy "staff can read inventory movements" on public.inventory_movements for select to authenticated using (public.current_user_role() is not null);

create policy "admin and reception can manage clients"
on public.clients for all to authenticated
using (public.current_user_role() in ('admin', 'reception'))
with check (public.current_user_role() in ('admin', 'reception'));

create policy "admin and reception can manage appointments"
on public.appointments for all to authenticated
using (public.current_user_role() in ('admin', 'reception'))
with check (public.current_user_role() in ('admin', 'reception'));

create policy "admin and reception can manage appointment services"
on public.appointment_services for all to authenticated
using (public.current_user_role() in ('admin', 'reception'))
with check (public.current_user_role() in ('admin', 'reception'));

create policy "admin and reception can manage bookings"
on public.public_bookings for update to authenticated
using (public.current_user_role() in ('admin', 'reception'))
with check (public.current_user_role() in ('admin', 'reception'));

create policy "admin and reception can manage sales"
on public.sales for all to authenticated
using (public.current_user_role() in ('admin', 'reception'))
with check (public.current_user_role() in ('admin', 'reception'));

create policy "admin and reception can manage payments"
on public.payments for all to authenticated
using (public.current_user_role() in ('admin', 'reception'))
with check (public.current_user_role() in ('admin', 'reception'));

create policy "admin can manage catalog"
on public.services for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin can manage employees"
on public.employees for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin can manage working hours"
on public.employee_working_hours for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin can manage time blocks"
on public.employee_time_blocks for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin can manage products"
on public.products for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin can manage inventory movements"
on public.inventory_movements for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
