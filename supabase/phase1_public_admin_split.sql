alter table public.products
add column if not exists public_visible boolean not null default false;

drop policy if exists "public can read visible products" on public.products;

create policy "public can read visible products"
on public.products for select
using (active = true and public_visible = true);
