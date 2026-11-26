create or replace function public.edit_order(_shop uuid,_order uuid,_customer_id uuid,_price_tier text,_expected_date date,_note text,_lines jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare o record; resolved jsonb; l jsonb; v_total bigint:=0;
begin
 perform public._assert_can_write(_shop);
 select * into o from public.orders where id=_order and shop_id=_shop for update;
 if not found then raise exception 'Commande introuvable.' using errcode='GS404'; end if;
 if o.status<>'en_attente' then raise exception 'Seules les commandes en attente peuvent être modifiées.' using errcode='GS422'; end if;
 if o.deposit_total>0 then raise exception 'Une commande avec acompte ne peut pas être modifiée.' using errcode='GS422'; end if;
 if _customer_id is null or not exists(select 1 from public.customers where id=_customer_id and shop_id=_shop) then raise exception 'Choisissez un client valide.' using errcode='GS422'; end if;
 if _price_tier not in ('retail','semi','wholesale') then raise exception 'Tarif invalide.' using errcode='GS422'; end if;
 if _expected_date is not null and _expected_date < (now() at time zone public._shop_tz(_shop))::date then raise exception 'La date prévue ne peut pas être dans le passé.' using errcode='GS422'; end if;
 resolved:=public._resolve_lines(_shop,_price_tier,_lines);
 delete from public.order_lines where order_id=_order;
 for l in select * from jsonb_array_elements(resolved) loop
  insert into public.order_lines(shop_id,order_id,article_id,product_name,variant_name,packaging_id,packaging_name,factor,quantity,base_quantity,unit_price,line_gross,line_discount,line_total)
  values(_shop,_order,(l->>'article_id')::uuid,l->>'product_name',coalesce(l->>'variant_name',''),nullif(l->>'packaging_id','')::uuid,l->>'packaging_name',(l->>'factor')::numeric,(l->>'quantity')::numeric,(l->>'base_quantity')::numeric,(l->>'unit_price')::bigint,(l->>'line_gross')::bigint,(l->>'line_discount')::bigint,(l->>'line_gross')::bigint-(l->>'line_discount')::bigint);
  v_total:=v_total+(l->>'line_gross')::bigint-(l->>'line_discount')::bigint;
 end loop;
 update public.orders set customer_id=_customer_id,price_tier=_price_tier,expected_date=_expected_date,note=nullif(btrim(coalesce(_note,'')),''),total=v_total,updated_at=now() where id=_order;
 perform public._refresh_order(_order);
end $$;
grant execute on function public.edit_order(uuid,uuid,uuid,text,date,text,jsonb) to authenticated;
