insert into public.services (name, category, description, base_price, duration_minutes, online_booking_enabled)
select seed.name, seed.category, seed.description, seed.base_price, seed.duration_minutes, seed.online_booking_enabled
from (
  values
    ('Gel semipermanente', 'manos', 'Color, limpieza express y acabado brillo.', 650::numeric, 50, true),
    ('Acrilico premium', 'acrilico', 'Extension, estructura y diseno personalizado.', 1250::numeric, 90, true),
    ('Pedicure spa', 'pies', 'Exfoliacion, hidratacion y esmaltado profesional.', 890::numeric, 70, true),
    ('Diseno artistico', 'diseno', 'Detalles finos, chrome, pedreria o frances moderno.', 280::numeric, 30, true)
) as seed(name, category, description, base_price, duration_minutes, online_booking_enabled)
where not exists (
  select 1 from public.services where public.services.name = seed.name
);

insert into public.employees (full_name, specialty, commission_rate, active)
select seed.full_name, seed.specialty, seed.commission_rate, true
from (
  values
    ('Karla Mendoza', 'Acrilico premium', 18::numeric),
    ('Rosa Gutierrez', 'Pedicure spa', 15::numeric),
    ('Lucia Perez', 'Diseno artistico', 20::numeric)
) as seed(full_name, specialty, commission_rate)
where not exists (
  select 1 from public.employees where public.employees.full_name = seed.full_name
);

insert into public.employee_working_hours (employee_id, weekday, start_time, end_time, active)
select employees.id, days.weekday, '09:00'::time, '18:00'::time, true
from public.employees
cross join (
  values (1), (2), (3), (4), (5), (6)
) as days(weekday)
where employees.full_name in ('Karla Mendoza', 'Rosa Gutierrez', 'Lucia Perez')
and not exists (
  select 1
  from public.employee_working_hours existing
  where existing.employee_id = employees.id
    and existing.weekday = days.weekday
    and existing.start_time = '09:00'::time
    and existing.end_time = '18:00'::time
);

insert into public.products (name, brand, category, unit, current_stock, minimum_stock, cost, supplier, active, public_visible)
select seed.name, seed.brand, seed.category, seed.unit, seed.current_stock, seed.minimum_stock, seed.cost, seed.supplier, true, true
from (
  values
    ('Top coat brillo', 'Gelish', 'selladores', 'unidad', 12::numeric, 4::numeric, 180::numeric, 'Proveedor profesional'),
    ('Base coat', 'OPI Professional', 'preparacion', 'unidad', 10::numeric, 3::numeric, 210::numeric, 'Proveedor profesional'),
    ('Monomero acrilico', 'Mia Secret', 'acrilico', 'unidad', 6::numeric, 3::numeric, 420::numeric, 'Proveedor profesional'),
    ('Aceite para cuticula', 'Cuccio', 'cuidado', 'unidad', 14::numeric, 5::numeric, 160::numeric, 'Proveedor profesional')
) as seed(name, brand, category, unit, current_stock, minimum_stock, cost, supplier)
where not exists (
  select 1 from public.products where public.products.name = seed.name
);
