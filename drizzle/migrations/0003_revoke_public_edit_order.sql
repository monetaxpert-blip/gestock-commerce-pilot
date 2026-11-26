revoke all on function public.edit_order(uuid,uuid,uuid,text,date,text,jsonb) from public, anon;
grant execute on function public.edit_order(uuid,uuid,uuid,text,date,text,jsonb) to authenticated;
grant execute on function public.edit_order(uuid,uuid,uuid,text,date,text,jsonb) to service_role;
