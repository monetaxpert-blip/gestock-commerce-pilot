-- Prevent a concurrent customer settlement from being reported as fully allocated
-- when another transaction has already settled part of the customer's outstanding balance.
create or replace function public.settle_customer(
  _shop uuid,
  _operation_key uuid,
  _customer uuid,
  _method text,
  _amount bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining bigint;
  s record;
  v_part bigint;
  v_total_due bigint;
  v_first boolean := true;
begin
  perform public._assert_can_write(_shop);

  if _operation_key is null then
    raise exception 'Clé d''opération manquante.' using errcode = 'GS422';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));

  if exists (
    select 1
    from public.payments pa
    where pa.shop_id = _shop
      and pa.operation_key = _operation_key
  ) then
    return 0;
  end if;

  if not exists (
    select 1
    from public.customers c
    where c.id = _customer
      and c.shop_id = _shop
  ) then
    raise exception 'Client introuvable.' using errcode = 'GS404';
  end if;

  if _method is null or _method not in ('cash','wave','orange_money','free_money','card','transfer','other') then
    raise exception 'Moyen de paiement invalide.' using errcode = 'GS422';
  end if;

  select coalesce(sum(sa.amount_due), 0)
    into v_total_due
    from public.sales sa
   where sa.shop_id = _shop
     and sa.customer_id = _customer
     and sa.status = 'validated';

  if _amount is null or _amount <= 0 then
    raise exception 'Montant invalide.' using errcode = 'GS422';
  end if;

  if _amount > v_total_due then
    raise exception 'Le montant dépasse ce que doit le client (% FCFA).', v_total_due using errcode = 'GS422';
  end if;

  v_remaining := _amount;

  for s in
    select sa.id, sa.amount_due
      from public.sales sa
     where sa.shop_id = _shop
       and sa.customer_id = _customer
       and sa.status = 'validated'
       and sa.amount_due > 0
     order by sa.created_at asc
     for update
  loop
    exit when v_remaining <= 0;

    v_part := least(v_remaining, s.amount_due);

    insert into public.payments (
      shop_id, sale_id, customer_id, direction, kind, method, amount, operation_key, created_by
    )
    values (
      _shop, s.id, _customer, 'in', 'settlement', _method, v_part,
      case when v_first then _operation_key else null end, auth.uid()
    );

    v_first := false;
    perform public._refresh_sale(s.id);
    v_remaining := v_remaining - v_part;
  end loop;

  -- The balance may have changed while this transaction waited for row locks.
  -- Abort atomically rather than recording a payment smaller than the amount requested.
  if v_remaining > 0 then
    raise exception 'Le solde du client a changé pendant le règlement. Actualisez la page puis réessayez.'
      using errcode = 'GS409';
  end if;

  return _amount;
end $$;
