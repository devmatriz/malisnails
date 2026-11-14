create or replace function public.get_public_available_slots(
  p_date date,
  p_service_id uuid
)
returns table(slot time)
language sql
security definer
set search_path = public
as $$
  with selected_service as (
    select duration_minutes
    from public.services
    where id = p_service_id
      and active = true
      and online_booking_enabled = true
    limit 1
  ), candidate_slots as (
    select
      hours.employee_id,
      generated_slot::time as slot,
      (generated_slot + make_interval(mins => selected_service.duration_minutes))::time as slot_end
    from public.employee_working_hours hours
    cross join selected_service
    cross join lateral generate_series(
      p_date + hours.start_time,
      p_date + hours.end_time - make_interval(mins => selected_service.duration_minutes),
      interval '30 minutes'
    ) as generated_slot
    where hours.active = true
      and hours.weekday = extract(dow from p_date)::integer
  )
  select distinct candidate_slots.slot
  from candidate_slots
  where not exists (
    select 1
    from public.employee_time_blocks blocks
    where blocks.employee_id = candidate_slots.employee_id
      and blocks.block_date = p_date
      and candidate_slots.slot < blocks.end_time
      and candidate_slots.slot_end > blocks.start_time
  )
  and not exists (
    select 1
    from public.appointments appointments
    where appointments.status in ('pending', 'confirmed', 'in_progress')
      and appointments.starts_at::date = p_date
      and (appointments.employee_id = candidate_slots.employee_id or appointments.employee_id is null)
      and candidate_slots.slot < coalesce(appointments.ends_at, appointments.starts_at + interval '1 hour')::time
      and candidate_slots.slot_end > appointments.starts_at::time
  )
  order by candidate_slots.slot;
$$;

grant execute on function public.get_public_available_slots(date, uuid) to anon, authenticated;
