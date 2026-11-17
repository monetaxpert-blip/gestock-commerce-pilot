create or replace function public._assert_can_write(_shop uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.is_shop_member(_shop) then
    raise exception 'Accès refusé.' using errcode = 'GS403';
  end if;
  if not public.shop_is_writable(_shop) then
    raise exception 'Votre accès est en lecture seule : la période d''essai ou l''abonnement est terminé.' using errcode = 'GS402';
  end if;
end $$;

create or replace function public._assert_member(_shop uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.is_shop_member(_shop) then
    raise exception 'Accès refusé.' using errcode = 'GS403';
  end if;
end $$;

create or replace function public._shop_tz(_shop uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select timezone from public.shops where id = _shop), 'Africa/Dakar')
$$;

create or replace function public._next_number(_shop uuid, _type text) returns text
language plpgsql security definer set search_path = public as $$
declare v_year int; v_n int;
begin
  v_year := extract(year from (now() at time zone public._shop_tz(_shop)))::int;
  insert into public.document_counters (shop_id, doc_type, year, last_value) values (_shop, _type, v_year, 1)
  on conflict (shop_id, doc_type, year) do update set last_value = public.document_counters.last_value + 1
  returning last_value into v_n;
  return _type || '-' || v_year || '-' || lpad(v_n::text, 6, '0');
end $$;

create or replace function public._next_sku(_shop uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_n int; v_candidate text;
begin
  loop
    insert into public.document_counters (shop_id, doc_type, year, last_value) values (_shop, 'SKU', 0, 1)
    on conflict (shop_id, doc_type, year) do update set last_value = public.document_counters.last_value + 1
    returning last_value into v_n;
    v_candidate := 'ART-' || lpad(v_n::text, 5, '0');
    exit when not exists (select 1 from public.articles ar where ar.shop_id = _shop and lower(ar.sku) = lower(v_candidate));
  end loop;
  return v_candidate;
end $$;

create or replace function public._apply_movement(
  _shop uuid, _article uuid, _qty numeric, _unit_cost numeric, _type text, _revalue boolean,
  _reason text, _note text, _ref_type text, _ref_id uuid, _ref_number text, _key uuid
) returns numeric
language plpgsql security definer set search_path = public as $$
declare a record; v_allow boolean; v_new_qty numeric; v_new_avg numeric; v_cost numeric; v_label text;
begin
  select ar.id, ar.stock_qty, ar.avg_cost, ar.variant_name, ar.fixed_cost, p.is_stocked, p.name as pname
    into a
    from public.articles ar join public.products p on p.id = ar.product_id
   where ar.id = _article and ar.shop_id = _shop
   for update of ar;
  if not found then raise exception 'Article introuvable.' using errcode = 'GS404'; end if;
  if not a.is_stocked then return coalesce(a.fixed_cost, 0); end if;
  if _qty = 0 then return a.avg_cost; end if;

  v_new_qty := a.stock_qty + _qty;
  if _qty < 0 then
    select s.allow_negative_stock into v_allow from public.shops s where s.id = _shop;
    if v_new_qty < 0 and not v_allow then
      v_label := a.pname || case when a.variant_name <> '' then ' (' || a.variant_name || ')' else '' end;
      raise exception 'Stock insuffisant pour « % » : % en stock, % demandé(s).', v_label, trim_scale(a.stock_qty), trim_scale(-_qty)
        using errcode = 'GS409';
    end if;
    v_cost := a.avg_cost; v_new_avg := a.avg_cost;
  elsif _revalue then
    v_cost := greatest(coalesce(_unit_cost, 0), 0);
    if a.stock_qty <= 0 then v_new_avg := v_cost;
    else v_new_avg := round((a.stock_qty * a.avg_cost + _qty * v_cost) / v_new_qty, 4);
    end if;
  else
    v_cost := a.avg_cost; v_new_avg := a.avg_cost;
  end if;

  update public.articles set stock_qty = v_new_qty, avg_cost = v_new_avg, updated_at = now() where id = _article;
  insert into public.stock_movements (shop_id, article_id, type, quantity, unit_cost, value, stock_after, avg_cost_after,
    reason, note, reference_type, reference_id, reference_number, operation_key, created_by)
  values (_shop, _article, _type, _qty, v_cost, round(abs(_qty) * v_cost), v_new_qty, v_new_avg,
    _reason, _note, _ref_type, _ref_id, _ref_number, _key, auth.uid());
  return v_cost;
end $$;

create or replace function public.create_shop(_name text, _phone text, _city text, _sector text, _address text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_shop uuid; v_tz text := 'Africa/Dakar';
begin
  if auth.uid() is null then raise exception 'Connexion requise.' using errcode = 'GS403'; end if;
  if exists (select 1 from public.shop_members m where m.user_id = auth.uid()) or exists (select 1 from public.shops s where s.owner_id = auth.uid()) then
    raise exception 'Vous disposez déjà d''une boutique.' using errcode = 'GS409';
  end if;
  if _name is null or char_length(btrim(_name)) < 2 then raise exception 'Le nom de la boutique est trop court.' using errcode = 'GS422'; end if;
  insert into public.shops (owner_id, name, phone, city, sector, address, timezone, trial_ends_at)
  values (auth.uid(), btrim(_name), nullif(btrim(coalesce(_phone,'')), ''), nullif(btrim(coalesce(_city,'')), ''),
          nullif(btrim(coalesce(_sector,'')), ''), nullif(btrim(coalesce(_address,'')), ''), v_tz,
          ((date_trunc('day', now() at time zone v_tz) + interval '14 days') at time zone v_tz))
  returning id into v_shop;
  insert into public.shop_members (shop_id, user_id, role) values (v_shop, auth.uid(), 'owner');
  return v_shop;
end $$;

create or replace function public._insert_article(_shop uuid, _product uuid, _a jsonb, _is_stocked boolean, _allow_decimal boolean)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_sku text; v_qty numeric; v_cost numeric; v_barcode text;
begin
  v_sku := upper(nullif(btrim(coalesce(_a->>'sku', '')), ''));
  if v_sku is null then v_sku := public._next_sku(_shop); end if;
  if exists (select 1 from public.articles ar where ar.shop_id = _shop and lower(ar.sku) = lower(v_sku)) then
    raise exception 'La référence « % » est déjà utilisée.', v_sku using errcode = 'GS409';
  end if;
  v_barcode := nullif(btrim(coalesce(_a->>'barcode','')), '');
  if v_barcode is not null and exists (select 1 from public.articles ar where ar.shop_id = _shop and ar.barcode = v_barcode) then
    raise exception 'Le code-barres « % » est déjà utilisé.', v_barcode using errcode = 'GS409';
  end if;
  if nullif(_a->>'price_retail','') is null or (_a->>'price_retail')::bigint < 0 then
    raise exception 'Le prix de détail est obligatoire.' using errcode = 'GS422';
  end if;
  insert into public.articles (shop_id, product_id, variant_name, sku, barcode, price_retail, price_semi, price_wholesale,
    fixed_cost, low_stock_threshold)
  values (_shop, _product, coalesce(_a->>'variant_name', ''), v_sku, v_barcode,
    (_a->>'price_retail')::bigint, nullif(_a->>'price_semi','')::bigint, nullif(_a->>'price_wholesale','')::bigint,
    nullif(_a->>'fixed_cost','')::bigint, coalesce(nullif(_a->>'low_stock_threshold','')::numeric, 0))
  returning id into v_id;

  v_qty := coalesce(nullif(_a->>'initial_qty','')::numeric, 0);
  v_cost := coalesce(nullif(_a->>'initial_unit_cost','')::numeric, 0);
  if v_qty < 0 then raise exception 'Le stock initial ne peut pas être négatif.' using errcode = 'GS422'; end if;
  if v_cost < 0 then raise exception 'Le coût d''achat ne peut pas être négatif.' using errcode = 'GS422'; end if;
  if v_qty > 0 and not _allow_decimal and v_qty <> trunc(v_qty) then
    raise exception 'Le stock initial doit être un nombre entier pour cette unité.' using errcode = 'GS422';
  end if;
  if _is_stocked and v_qty > 0 then
    perform public._apply_movement(_shop, v_id, round(v_qty, 3), v_cost, 'initial', true, null, 'Stock initial', 'article', v_id, null, null);
  end if;
  return v_id;
end $$;

create or replace function public.create_product(_shop uuid, _payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_pid uuid; a jsonb; pk jsonb; v_stocked boolean; v_unit text; v_decimal boolean; v_has_var boolean;
begin
  perform public._assert_can_write(_shop);
  if jsonb_typeof(_payload->'articles') is distinct from 'array' or jsonb_array_length(_payload->'articles') = 0 then
    raise exception 'Le produit doit avoir au moins un article.' using errcode = 'GS422';
  end if;
  if jsonb_array_length(_payload->'articles') > 100 then raise exception 'Trop de déclinaisons (100 maximum).' using errcode = 'GS422'; end if;
  v_stocked := coalesce((_payload->>'is_stocked')::boolean, true);
  v_unit := coalesce(_payload->>'base_unit', 'piece');
  v_decimal := v_unit in ('kg','g','litre','ml','metre');
  v_has_var := jsonb_array_length(_payload->'articles') > 1 or coalesce((_payload->>'has_variants')::boolean, false);

  insert into public.products (shop_id, name, category_id, description, base_unit, is_stocked, has_variants)
  values (_shop, _payload->>'name', nullif(_payload->>'category_id','')::uuid, nullif(btrim(coalesce(_payload->>'description','')), ''),
          v_unit, v_stocked, v_has_var)
  returning id into v_pid;

  for a in select * from jsonb_array_elements(_payload->'articles') loop
    if v_has_var and char_length(btrim(coalesce(a->>'variant_name',''))) = 0 then
      raise exception 'Chaque déclinaison doit avoir un nom (ex. « Rouge, M »).' using errcode = 'GS422';
    end if;
    perform public._insert_article(_shop, v_pid, a, v_stocked, v_decimal);
  end loop;

  if jsonb_typeof(_payload->'packagings') = 'array' then
    for pk in select * from jsonb_array_elements(_payload->'packagings') loop
      if coalesce(nullif(pk->>'factor','')::numeric, 0) <= 0 then raise exception 'Le facteur d''un conditionnement doit être positif.' using errcode = 'GS422'; end if;
      insert into public.packagings (shop_id, product_id, name, factor) values (_shop, v_pid, pk->>'name', (pk->>'factor')::numeric);
    end loop;
  end if;
  return v_pid;
end $$;

create or replace function public.add_article(_shop uuid, _product uuid, _payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare p record; v_id uuid;
begin
  perform public._assert_can_write(_shop);
  select * into p from public.products pr where pr.id = _product and pr.shop_id = _shop;
  if not found then raise exception 'Produit introuvable.' using errcode = 'GS404'; end if;
  if char_length(btrim(coalesce(_payload->>'variant_name',''))) = 0 then
    raise exception 'Donnez un nom à la déclinaison.' using errcode = 'GS422';
  end if;
  if exists (select 1 from public.articles ar where ar.product_id = _product and ar.variant_name = '') then
    raise exception 'Nommez d''abord la déclinaison existante de ce produit.' using errcode = 'GS422';
  end if;
  v_id := public._insert_article(_shop, _product, _payload, p.is_stocked, p.allow_decimal);
  update public.products set has_variants = true where id = _product;
  return v_id;
end $$;

create or replace function public.delete_product(_shop uuid, _product uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._assert_can_write(_shop);
  if not exists (select 1 from public.products pr where pr.id = _product and pr.shop_id = _shop) then
    raise exception 'Produit introuvable.' using errcode = 'GS404';
  end if;
  if exists (select 1 from public.sale_lines sl join public.articles a on a.id = sl.article_id where a.product_id = _product)
     or exists (select 1 from public.order_lines ol join public.articles a on a.id = ol.article_id where a.product_id = _product)
     or exists (select 1 from public.purchase_lines pl join public.articles a on a.id = pl.article_id where a.product_id = _product)
     or exists (select 1 from public.stock_movements m join public.articles a on a.id = m.article_id where a.product_id = _product and m.type <> 'initial') then
    raise exception 'Ce produit a déjà un historique. Archivez-le plutôt que de le supprimer.' using errcode = 'GS409';
  end if;
  delete from public.stock_movements where article_id in (select a.id from public.articles a where a.product_id = _product);
  delete from public.products where id = _product;
end $$;

create or replace function public.record_purchase(_shop uuid, _operation_key uuid, _supplier text, _received_at date, _note text, _lines jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_pid uuid; v_existing uuid; v_num text; l jsonb; a record; v_f numeric; v_pkid uuid; v_pkname text; v_q numeric; v_uc bigint; v_total bigint := 0; v_today date;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select pu.id into v_existing from public.purchases pu where pu.shop_id = _shop and pu.operation_key = _operation_key;
  if found then return v_existing; end if;

  v_today := (now() at time zone public._shop_tz(_shop))::date;
  if _received_at is null or _received_at > v_today or _received_at < v_today - 30 then
    raise exception 'La date de réception doit être comprise entre les 30 derniers jours et aujourd''hui.' using errcode = 'GS422';
  end if;
  if _lines is null or jsonb_typeof(_lines) <> 'array' or jsonb_array_length(_lines) = 0 then
    raise exception 'Ajoutez au moins un article.' using errcode = 'GS422';
  end if;
  if jsonb_array_length(_lines) > 200 then raise exception 'Trop de lignes (200 maximum).' using errcode = 'GS422'; end if;

  v_num := public._next_number(_shop, 'APP');
  insert into public.purchases (shop_id, number, supplier_name, received_at, note, operation_key, created_by)
  values (_shop, v_num, nullif(btrim(coalesce(_supplier,'')), ''), _received_at, nullif(btrim(coalesce(_note,'')), ''), _operation_key, auth.uid())
  returning id into v_pid;

  for l in select * from jsonb_array_elements(_lines) loop
    select ar.id, ar.variant_name, p.id as prod_id, p.name as pname, p.is_stocked, p.allow_decimal, p.base_unit
      into a from public.articles ar join public.products p on p.id = ar.product_id
     where ar.id = (l->>'article_id')::uuid and ar.shop_id = _shop;
    if not found then raise exception 'Article introuvable.' using errcode = 'GS404'; end if;
    if not a.is_stocked then raise exception '« % » n''est pas suivi en stock.', a.pname using errcode = 'GS422'; end if;
    v_q := nullif(l->>'quantity','')::numeric;
    if v_q is null or v_q <= 0 or v_q > 1000000 then raise exception 'Quantité invalide pour « % ».', a.pname using errcode = 'GS422'; end if;
    v_uc := nullif(l->>'unit_cost','')::bigint;
    if v_uc is null or v_uc < 0 then raise exception 'Coût d''achat invalide pour « % ».', a.pname using errcode = 'GS422'; end if;
    v_f := 1; v_pkid := null; v_pkname := a.base_unit;
    if nullif(l->>'packaging_id','') is not null then
      select pk.id, pk.name, pk.factor into v_pkid, v_pkname, v_f from public.packagings pk
       where pk.id = (l->>'packaging_id')::uuid and pk.product_id = a.prod_id and pk.archived_at is null;
      if v_pkid is null then raise exception 'Conditionnement introuvable.' using errcode = 'GS404'; end if;
    end if;
    if not a.allow_decimal and round(v_q * v_f, 3) <> trunc(round(v_q * v_f, 3)) then
      raise exception 'La quantité de « % » doit correspondre à un nombre entier d''unités.', a.pname using errcode = 'GS422';
    end if;
    insert into public.purchase_lines (shop_id, purchase_id, article_id, product_name, variant_name, packaging_id, packaging_name,
      factor, quantity, base_quantity, unit_cost, line_total)
    values (_shop, v_pid, a.id, a.pname, a.variant_name, v_pkid, v_pkname, v_f, round(v_q, 3), round(v_q * v_f, 3), v_uc, round(v_q * v_uc));
    v_total := v_total + round(v_q * v_uc);
    perform public._apply_movement(_shop, a.id, round(v_q * v_f, 3), v_uc::numeric / v_f, 'purchase', true, null, null, 'purchase', v_pid, v_num, null);
  end loop;

  update public.purchases set total_cost = v_total where id = v_pid;
  return v_pid;
end $$;

create or replace function public.adjust_stock(_shop uuid, _operation_key uuid, _article uuid, _quantity numeric, _reason text, _note text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_existing uuid; a record;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select m.id into v_existing from public.stock_movements m where m.shop_id = _shop and m.operation_key = _operation_key;
  if found then return v_existing; end if;
  if _reason is null or _reason not in ('casse','perte','vol','peremption','erreur_saisie','don','consommation','retrouve','autre') then
    raise exception 'Choisissez un motif d''ajustement.' using errcode = 'GS422';
  end if;
  if _quantity is null or _quantity = 0 then raise exception 'La quantité doit être différente de zéro.' using errcode = 'GS422'; end if;
  select ar.id, p.is_stocked, p.allow_decimal into a from public.articles ar join public.products p on p.id = ar.product_id
   where ar.id = _article and ar.shop_id = _shop;
  if not found then raise exception 'Article introuvable.' using errcode = 'GS404'; end if;
  if not a.is_stocked then raise exception 'Cet article n''est pas suivi en stock.' using errcode = 'GS422'; end if;
  if not a.allow_decimal and _quantity <> trunc(_quantity) then raise exception 'La quantité doit être un nombre entier.' using errcode = 'GS422'; end if;
  if _reason = 'retrouve' and _quantity < 0 then raise exception 'Le motif « retrouvé » correspond à une entrée.' using errcode = 'GS422'; end if;
  perform public._apply_movement(_shop, _article, round(_quantity, 3), null, 'adjustment', false, _reason,
    nullif(left(btrim(coalesce(_note,'')), 300), ''), 'adjustment', null, public._next_number(_shop, 'AJU'), _operation_key);
  select m.id into v_existing from public.stock_movements m where m.shop_id = _shop and m.operation_key = _operation_key;
  return v_existing;
end $$;

create or replace function public._resolve_lines(_shop uuid, _tier text, _lines jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare l jsonb; v_res jsonb := '[]'::jsonb; a record; v_f numeric; v_pkid uuid; v_pkname text; v_q numeric;
  v_tier_price bigint; v_up bigint; v_gross bigint; v_disc bigint; v_label text;
begin
  if _lines is null or jsonb_typeof(_lines) <> 'array' or jsonb_array_length(_lines) = 0 then
    raise exception 'Ajoutez au moins un article.' using errcode = 'GS422';
  end if;
  if jsonb_array_length(_lines) > 200 then raise exception 'Trop de lignes (200 maximum).' using errcode = 'GS422'; end if;
  for l in select * from jsonb_array_elements(_lines) loop
    select ar.id, ar.variant_name, ar.price_retail, ar.price_semi, ar.price_wholesale, ar.archived_at,
           p.id as prod_id, p.name as pname, p.allow_decimal, p.archived_at as parch, p.base_unit
      into a from public.articles ar join public.products p on p.id = ar.product_id
     where ar.id = (l->>'article_id')::uuid and ar.shop_id = _shop;
    if not found then raise exception 'Article introuvable.' using errcode = 'GS404'; end if;
    v_label := a.pname || case when a.variant_name <> '' then ' (' || a.variant_name || ')' else '' end;
    if a.archived_at is not null or a.parch is not null then
      raise exception '« % » est archivé et ne peut plus être vendu.', v_label using errcode = 'GS422';
    end if;
    v_q := nullif(l->>'quantity','')::numeric;
    if v_q is null or v_q <= 0 or v_q > 1000000 then raise exception 'Quantité invalide pour « % ».', v_label using errcode = 'GS422'; end if;
    if v_q <> round(v_q, 3) then raise exception 'Trois décimales au maximum pour « % ».', v_label using errcode = 'GS422'; end if;
    v_f := 1; v_pkid := null; v_pkname := a.base_unit;
    if nullif(l->>'packaging_id','') is not null then
      select pk.id, pk.name, pk.factor into v_pkid, v_pkname, v_f from public.packagings pk
       where pk.id = (l->>'packaging_id')::uuid and pk.product_id = a.prod_id and pk.archived_at is null;
      if v_pkid is null then raise exception 'Conditionnement introuvable pour « % ».', v_label using errcode = 'GS404'; end if;
    end if;
    if not a.allow_decimal and v_q <> trunc(v_q) then
      raise exception 'La quantité de « % » doit être un nombre entier.', v_label using errcode = 'GS422';
    end if;
    v_tier_price := case _tier when 'semi' then coalesce(a.price_semi, a.price_retail)
                               when 'wholesale' then coalesce(a.price_wholesale, a.price_retail)
                               else a.price_retail end;
    v_up := round(v_f * v_tier_price);
    v_gross := round(v_q * v_up);
    v_disc := coalesce(nullif(l->>'line_discount','')::bigint, 0);
    if v_disc < 0 or v_disc > v_gross then raise exception 'Remise invalide sur « % ».', v_label using errcode = 'GS422'; end if;
    v_res := v_res || jsonb_build_array(jsonb_build_object(
      'article_id', a.id, 'product_name', a.pname, 'variant_name', a.variant_name,
      'packaging_id', v_pkid, 'packaging_name', v_pkname, 'factor', v_f, 'quantity', v_q,
      'base_quantity', round(v_q * v_f, 3), 'unit_price', v_up, 'line_gross', v_gross, 'line_discount', v_disc));
  end loop;
  return v_res;
end $$;

create or replace function public._insert_sale(_shop uuid, _key uuid, _customer uuid, _tier text, _order uuid,
  _global_discount bigint, _resolved jsonb, _note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_sid uuid; v_num text; v_n int; i int; l jsonb; v_n1_total bigint := 0; v_gross bigint := 0; v_ldisc bigint := 0;
  v_shares bigint[]; v_largest int := 0; v_largest_val bigint := -1; v_alloc bigint := 0; v_n1 bigint; v_net bigint; v_ucost numeric; v_lcost bigint;
  v_cost bigint := 0; v_net_total bigint := 0; v_unreliable boolean := false; v_stocked boolean;
begin
  v_n := jsonb_array_length(_resolved);
  for i in 0 .. v_n - 1 loop
    l := _resolved->i;
    v_n1 := (l->>'line_gross')::bigint - (l->>'line_discount')::bigint;
    v_n1_total := v_n1_total + v_n1;
    v_gross := v_gross + (l->>'line_gross')::bigint;
    v_ldisc := v_ldisc + (l->>'line_discount')::bigint;
    if v_n1 > v_largest_val then v_largest_val := v_n1; v_largest := i; end if;
  end loop;
  if _global_discount < 0 or _global_discount > v_n1_total then
    raise exception 'La remise globale dépasse le montant de la vente.' using errcode = 'GS422';
  end if;
  v_shares := array_fill(0::bigint, array[v_n]);
  if _global_discount > 0 and v_n1_total > 0 then
    for i in 0 .. v_n - 1 loop
      l := _resolved->i;
      v_n1 := (l->>'line_gross')::bigint - (l->>'line_discount')::bigint;
      v_shares[i + 1] := round(_global_discount::numeric * v_n1 / v_n1_total);
      v_alloc := v_alloc + v_shares[i + 1];
    end loop;
    v_shares[v_largest + 1] := v_shares[v_largest + 1] + (_global_discount - v_alloc);
  end if;

  v_num := public._next_number(_shop, 'V');
  insert into public.sales (shop_id, number, customer_id, order_id, price_tier, note, operation_key, created_by)
  values (_shop, v_num, _customer, _order, coalesce(_tier, 'retail'), nullif(btrim(coalesce(_note,'')), ''), _key, auth.uid())
  returning id into v_sid;

  for i in 0 .. v_n - 1 loop
    l := _resolved->i;
    v_n1 := (l->>'line_gross')::bigint - (l->>'line_discount')::bigint;
    v_net := v_n1 - v_shares[i + 1];
    select p.is_stocked into v_stocked from public.articles ar join public.products p on p.id = ar.product_id where ar.id = (l->>'article_id')::uuid;
    v_ucost := public._apply_movement(_shop, (l->>'article_id')::uuid, -((l->>'base_quantity')::numeric), null, 'sale', false,
      null, null, 'sale', v_sid, v_num, null);
    v_lcost := round((l->>'base_quantity')::numeric * v_ucost);
    if v_stocked and v_ucost = 0 then v_unreliable := true; end if;
    insert into public.sale_lines (shop_id, sale_id, article_id, product_name, variant_name, packaging_id, packaging_name, factor,
      quantity, base_quantity, unit_price, line_gross, line_discount, global_discount_share, line_net, unit_cost, line_cost, line_margin)
    values (_shop, v_sid, (l->>'article_id')::uuid, l->>'product_name', coalesce(l->>'variant_name',''), nullif(l->>'packaging_id','')::uuid,
      l->>'packaging_name', (l->>'factor')::numeric, (l->>'quantity')::numeric, (l->>'base_quantity')::numeric,
      (l->>'unit_price')::bigint, (l->>'line_gross')::bigint, (l->>'line_discount')::bigint, v_shares[i + 1], v_net, v_ucost, v_lcost, v_net - v_lcost);
    v_cost := v_cost + v_lcost;
    v_net_total := v_net_total + v_net;
  end loop;

  update public.sales set subtotal = v_gross, discount_total = v_ldisc + _global_discount, total = v_net_total,
    cost_total = v_cost, margin = v_net_total - v_cost, amount_due = v_net_total, has_unreliable_margin = v_unreliable
   where id = v_sid;
  return v_sid;
end $$;

create or replace function public._refresh_sale(_sale uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_paid bigint;
begin
  select coalesce(sum(case when pa.direction = 'in' then pa.amount else -pa.amount end), 0) into v_paid from public.payments pa where pa.sale_id = _sale;
  update public.sales set amount_paid = v_paid,
    amount_due = case when status = 'validated' then greatest(0, total - v_paid) else 0 end
   where id = _sale;
end $$;

create or replace function public._refresh_order(_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_dep bigint;
begin
  select coalesce(sum(case when pa.direction = 'in' then pa.amount else -pa.amount end), 0) into v_dep
    from public.payments pa where pa.order_id = _order and pa.kind in ('deposit','refund');
  update public.orders set deposit_total = v_dep, updated_at = now() where id = _order;
end $$;

create or replace function public._add_payments(_shop uuid, _sale uuid, _order uuid, _customer uuid, _payments jsonb, _kind text, _max bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare p jsonb; v_amt bigint; v_total bigint := 0; v_m text;
begin
  if _payments is null or jsonb_typeof(_payments) <> 'array' then return 0; end if;
  if jsonb_array_length(_payments) > 10 then raise exception 'Trop de paiements.' using errcode = 'GS422'; end if;
  for p in select * from jsonb_array_elements(_payments) loop
    v_amt := coalesce(nullif(p->>'amount','')::bigint, 0);
    if v_amt = 0 then continue; end if;
    if v_amt < 0 then raise exception 'Montant de paiement invalide.' using errcode = 'GS422'; end if;
    v_m := p->>'method';
    if v_m is null or v_m not in ('cash','wave','orange_money','free_money','card','transfer','other') then
      raise exception 'Moyen de paiement invalide.' using errcode = 'GS422';
    end if;
    v_total := v_total + v_amt;
    insert into public.payments (shop_id, sale_id, order_id, customer_id, direction, kind, method, amount, note, created_by)
    values (_shop, _sale, _order, _customer, 'in', _kind, v_m, v_amt, nullif(left(btrim(coalesce(p->>'note','')), 300), ''), auth.uid());
  end loop;
  if v_total > _max then
    raise exception 'Le montant encaissé (% FCFA) dépasse le montant restant (% FCFA).', v_total, _max using errcode = 'GS422';
  end if;
  return v_total;
end $$;

create or replace function public.create_sale(_shop uuid, _operation_key uuid, _customer_id uuid, _price_tier text,
  _global_discount bigint, _lines jsonb, _payments jsonb, _note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_existing uuid; v_sid uuid; v_resolved jsonb; v_tot bigint; v_due bigint;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select s.id into v_existing from public.sales s where s.shop_id = _shop and s.operation_key = _operation_key;
  if found then return v_existing; end if;
  if coalesce(_price_tier, 'retail') not in ('retail','semi','wholesale') then raise exception 'Niveau de prix invalide.' using errcode = 'GS422'; end if;
  if _customer_id is not null and not exists (select 1 from public.customers c where c.id = _customer_id and c.shop_id = _shop) then
    raise exception 'Client introuvable.' using errcode = 'GS404';
  end if;
  v_resolved := public._resolve_lines(_shop, coalesce(_price_tier, 'retail'), _lines);
  v_sid := public._insert_sale(_shop, _operation_key, _customer_id, coalesce(_price_tier, 'retail'), null, coalesce(_global_discount, 0), v_resolved, _note);
  select s.total into v_tot from public.sales s where s.id = v_sid;
  perform public._add_payments(_shop, v_sid, null, _customer_id, _payments, 'sale', v_tot);
  perform public._refresh_sale(v_sid);
  select s.amount_due into v_due from public.sales s where s.id = v_sid;
  if v_due > 0 and _customer_id is null then
    raise exception 'Choisissez un client pour enregistrer un reste à payer.' using errcode = 'GS422';
  end if;
  return v_sid;
end $$;

create or replace function public.record_sale_payment(_shop uuid, _operation_key uuid, _sale uuid, _method text, _amount bigint, _note text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare s record; v_pid uuid;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select pa.id into v_pid from public.payments pa where pa.shop_id = _shop and pa.operation_key = _operation_key;
  if found then return v_pid; end if;
  select * into s from public.sales sa where sa.id = _sale and sa.shop_id = _shop for update;
  if not found then raise exception 'Vente introuvable.' using errcode = 'GS404'; end if;
  if s.status <> 'validated' then raise exception 'Cette vente est annulée.' using errcode = 'GS422'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Montant invalide.' using errcode = 'GS422'; end if;
  if _amount > s.amount_due then raise exception 'Le montant dépasse le reste à payer (% FCFA).', s.amount_due using errcode = 'GS422'; end if;
  if _method is null or _method not in ('cash','wave','orange_money','free_money','card','transfer','other') then
    raise exception 'Moyen de paiement invalide.' using errcode = 'GS422';
  end if;
  insert into public.payments (shop_id, sale_id, customer_id, direction, kind, method, amount, note, operation_key, created_by)
  values (_shop, _sale, s.customer_id, 'in', 'settlement', _method, _amount, nullif(left(btrim(coalesce(_note,'')),300),''), _operation_key, auth.uid())
  returning id into v_pid;
  perform public._refresh_sale(_sale);
  return v_pid;
end $$;

create or replace function public.settle_customer(_shop uuid, _operation_key uuid, _customer uuid, _method text, _amount bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare v_remaining bigint; s record; v_part bigint; v_total_due bigint; v_first boolean := true;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  if exists (select 1 from public.payments pa where pa.shop_id = _shop and pa.operation_key = _operation_key) then return 0; end if;
  if not exists (select 1 from public.customers c where c.id = _customer and c.shop_id = _shop) then raise exception 'Client introuvable.' using errcode = 'GS404'; end if;
  if _method is null or _method not in ('cash','wave','orange_money','free_money','card','transfer','other') then
    raise exception 'Moyen de paiement invalide.' using errcode = 'GS422';
  end if;
  select coalesce(sum(sa.amount_due), 0) into v_total_due from public.sales sa where sa.shop_id = _shop and sa.customer_id = _customer and sa.status = 'validated';
  if _amount is null or _amount <= 0 then raise exception 'Montant invalide.' using errcode = 'GS422'; end if;
  if _amount > v_total_due then raise exception 'Le montant dépasse ce que doit le client (% FCFA).', v_total_due using errcode = 'GS422'; end if;
  v_remaining := _amount;
  for s in select sa.id, sa.amount_due from public.sales sa where sa.shop_id = _shop and sa.customer_id = _customer and sa.status = 'validated' and sa.amount_due > 0
           order by sa.created_at asc for update loop
    exit when v_remaining <= 0;
    v_part := least(v_remaining, s.amount_due);
    insert into public.payments (shop_id, sale_id, customer_id, direction, kind, method, amount, operation_key, created_by)
    values (_shop, s.id, _customer, 'in', 'settlement', _method, v_part, case when v_first then _operation_key else null end, auth.uid());
    v_first := false;
    perform public._refresh_sale(s.id);
    v_remaining := v_remaining - v_part;
  end loop;
  return _amount;
end $$;

create or replace function public.cancel_sale(_shop uuid, _sale uuid, _reason text) returns void
language plpgsql security definer set search_path = public as $$
declare s record; l record; r record; v_tz text;
begin
  perform public._assert_can_write(_shop);
  select * into s from public.sales sa where sa.id = _sale and sa.shop_id = _shop for update;
  if not found then raise exception 'Vente introuvable.' using errcode = 'GS404'; end if;
  if s.status = 'cancelled' then return; end if;
  if _reason is null or char_length(btrim(_reason)) < 3 then raise exception 'Indiquez le motif de l''annulation.' using errcode = 'GS422'; end if;
  v_tz := public._shop_tz(_shop);
  if (s.created_at at time zone v_tz)::date <> (now() at time zone v_tz)::date then
    raise exception 'Une vente ne peut être annulée que le jour même.' using errcode = 'GS422';
  end if;
  for l in select sl.article_id, sl.base_quantity, sl.unit_cost from public.sale_lines sl where sl.sale_id = _sale loop
    perform public._apply_movement(_shop, l.article_id, l.base_quantity, l.unit_cost, 'sale_cancel', true,
      'annulation', left(btrim(_reason), 300), 'sale', _sale, s.number, null);
  end loop;
  if s.order_id is not null then
    update public.payments set sale_id = null where sale_id = _sale and order_id is not null;
    update public.orders set status = 'preparee', sale_id = null, delivered_at = null, updated_at = now() where id = s.order_id;
  end if;
  for r in select pa.method, sum(case when pa.direction = 'in' then pa.amount else -pa.amount end) as net
             from public.payments pa where pa.sale_id = _sale group by pa.method loop
    if r.net > 0 then
      insert into public.payments (shop_id, sale_id, customer_id, direction, kind, method, amount, note, created_by)
      values (_shop, _sale, s.customer_id, 'out', 'refund', r.method, r.net, 'Remboursement suite à annulation', auth.uid());
    end if;
  end loop;
  update public.sales set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = left(btrim(_reason), 300)
   where id = _sale;
  perform public._refresh_sale(_sale);
end $$;

create or replace function public.create_order(_shop uuid, _operation_key uuid, _customer_id uuid, _price_tier text,
  _expected_date date, _note text, _lines jsonb, _deposit jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_existing uuid; v_order uuid; v_resolved jsonb; l jsonb; v_total bigint := 0; v_tier text;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select o.id into v_existing from public.orders o where o.shop_id = _shop and o.operation_key = _operation_key;
  if found then return v_existing; end if;
  if _customer_id is null or not exists (select 1 from public.customers c where c.id = _customer_id and c.shop_id = _shop) then
    raise exception 'Choisissez un client pour la commande.' using errcode = 'GS422';
  end if;
  v_tier := coalesce(_price_tier, 'retail');
  if v_tier not in ('retail','semi','wholesale') then raise exception 'Niveau de prix invalide.' using errcode = 'GS422'; end if;
  if _expected_date is not null and _expected_date < (now() at time zone public._shop_tz(_shop))::date then
    raise exception 'La date prévue ne peut pas être dans le passé.' using errcode = 'GS422';
  end if;
  v_resolved := public._resolve_lines(_shop, v_tier, _lines);
  insert into public.orders (shop_id, number, customer_id, price_tier, expected_date, note, operation_key, created_by)
  values (_shop, public._next_number(_shop, 'CMD'), _customer_id, v_tier, _expected_date, nullif(btrim(coalesce(_note,'')), ''), _operation_key, auth.uid())
  returning id into v_order;
  for l in select * from jsonb_array_elements(v_resolved) loop
    insert into public.order_lines (shop_id, order_id, article_id, product_name, variant_name, packaging_id, packaging_name, factor,
      quantity, base_quantity, unit_price, line_gross, line_discount, line_total)
    values (_shop, v_order, (l->>'article_id')::uuid, l->>'product_name', coalesce(l->>'variant_name',''), nullif(l->>'packaging_id','')::uuid,
      l->>'packaging_name', (l->>'factor')::numeric, (l->>'quantity')::numeric, (l->>'base_quantity')::numeric,
      (l->>'unit_price')::bigint, (l->>'line_gross')::bigint, (l->>'line_discount')::bigint,
      (l->>'line_gross')::bigint - (l->>'line_discount')::bigint);
    v_total := v_total + (l->>'line_gross')::bigint - (l->>'line_discount')::bigint;
  end loop;
  update public.orders set total = v_total where id = v_order;
  if _deposit is not null and jsonb_typeof(_deposit) = 'object' and coalesce(nullif(_deposit->>'amount','')::bigint, 0) > 0 then
    perform public._add_payments(_shop, null, v_order, _customer_id, jsonb_build_array(_deposit), 'deposit', v_total);
    perform public._refresh_order(v_order);
  end if;
  return v_order;
end $$;

create or replace function public.set_order_status(_shop uuid, _order uuid, _status text) returns void
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  perform public._assert_can_write(_shop);
  select * into o from public.orders od where od.id = _order and od.shop_id = _shop for update;
  if not found then raise exception 'Commande introuvable.' using errcode = 'GS404'; end if;
  if o.status = _status then return; end if;
  if not ((o.status = 'en_attente' and _status = 'confirmee') or (o.status = 'confirmee' and _status = 'preparee')
          or (o.status = 'preparee' and _status = 'confirmee')) then
    raise exception 'Changement de statut impossible depuis ce statut.' using errcode = 'GS422';
  end if;
  update public.orders set status = _status, updated_at = now(),
    confirmed_at = case when _status = 'confirmee' then coalesce(confirmed_at, now()) else confirmed_at end,
    prepared_at = case when _status = 'preparee' then now() else prepared_at end
   where id = _order;
end $$;

create or replace function public.add_order_deposit(_shop uuid, _operation_key uuid, _order uuid, _method text, _amount bigint)
returns uuid
language plpgsql security definer set search_path = public as $$
declare o record; v_pid uuid;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select pa.id into v_pid from public.payments pa where pa.shop_id = _shop and pa.operation_key = _operation_key;
  if found then return v_pid; end if;
  select * into o from public.orders od where od.id = _order and od.shop_id = _shop for update;
  if not found then raise exception 'Commande introuvable.' using errcode = 'GS404'; end if;
  if o.status in ('livree','annulee') then raise exception 'Cette commande est clôturée.' using errcode = 'GS422'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Montant invalide.' using errcode = 'GS422'; end if;
  if o.deposit_total + _amount > o.total then
    raise exception 'Le total des acomptes ne peut pas dépasser le montant de la commande (reste % FCFA).', o.total - o.deposit_total using errcode = 'GS422';
  end if;
  if _method is null or _method not in ('cash','wave','orange_money','free_money','card','transfer','other') then
    raise exception 'Moyen de paiement invalide.' using errcode = 'GS422';
  end if;
  insert into public.payments (shop_id, order_id, customer_id, direction, kind, method, amount, operation_key, created_by)
  values (_shop, _order, o.customer_id, 'in', 'deposit', _method, _amount, _operation_key, auth.uid())
  returning id into v_pid;
  perform public._refresh_order(_order);
  return v_pid;
end $$;

create or replace function public.deliver_order(_shop uuid, _operation_key uuid, _order uuid, _payments jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare o record; v_sid uuid; v_resolved jsonb; v_due bigint;
begin
  perform public._assert_can_write(_shop);
  if _operation_key is null then raise exception 'Clé d''opération manquante.' using errcode = 'GS422'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_operation_key::text, 0));
  select s.id into v_sid from public.sales s where s.shop_id = _shop and s.operation_key = _operation_key;
  if found then return v_sid; end if;
  select * into o from public.orders od where od.id = _order and od.shop_id = _shop for update;
  if not found then raise exception 'Commande introuvable.' using errcode = 'GS404'; end if;
  if o.status = 'livree' then return o.sale_id; end if;
  if o.status not in ('confirmee','preparee') then
    raise exception 'Confirmez la commande avant de la livrer.' using errcode = 'GS422';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'article_id', ol.article_id, 'product_name', ol.product_name, 'variant_name', ol.variant_name, 'packaging_id', ol.packaging_id,
      'packaging_name', ol.packaging_name, 'factor', ol.factor, 'quantity', ol.quantity, 'base_quantity', ol.base_quantity,
      'unit_price', ol.unit_price, 'line_gross', ol.line_gross, 'line_discount', ol.line_discount) order by ol.id), '[]'::jsonb)
    into v_resolved from public.order_lines ol where ol.order_id = _order;
  v_sid := public._insert_sale(_shop, _operation_key, o.customer_id, o.price_tier, _order, 0, v_resolved, o.note);
  update public.payments set sale_id = v_sid where order_id = _order;
  perform public._refresh_sale(v_sid);
  select s.amount_due into v_due from public.sales s where s.id = v_sid;
  perform public._add_payments(_shop, v_sid, null, o.customer_id, _payments, 'sale', v_due);
  perform public._refresh_sale(v_sid);
  update public.orders set status = 'livree', sale_id = v_sid, delivered_at = now(), updated_at = now() where id = _order;
  return v_sid;
end $$;

create or replace function public.cancel_order(_shop uuid, _order uuid, _reason text, _deposit_action text) returns void
language plpgsql security definer set search_path = public as $$
declare o record; r record; v_net bigint;
begin
  perform public._assert_can_write(_shop);
  select * into o from public.orders od where od.id = _order and od.shop_id = _shop for update;
  if not found then raise exception 'Commande introuvable.' using errcode = 'GS404'; end if;
  if o.status = 'annulee' then return; end if;
  if o.status = 'livree' then raise exception 'Une commande livrée ne peut pas être annulée. Annulez la vente associée.' using errcode = 'GS422'; end if;
  if _reason is null or char_length(btrim(_reason)) < 3 then raise exception 'Indiquez le motif de l''annulation.' using errcode = 'GS422'; end if;
  v_net := o.deposit_total;
  if v_net > 0 then
    if _deposit_action is null or _deposit_action not in ('refund','retain') then
      raise exception 'Choisissez si l''acompte est remboursé ou conservé.' using errcode = 'GS422';
    end if;
    if _deposit_action = 'refund' then
      for r in select pa.method, sum(case when pa.direction = 'in' then pa.amount else -pa.amount end) as m
                 from public.payments pa where pa.order_id = _order and pa.kind in ('deposit','refund') group by pa.method loop
        if r.m > 0 then
          insert into public.payments (shop_id, order_id, customer_id, direction, kind, method, amount, note, created_by)
          values (_shop, _order, o.customer_id, 'out', 'refund', r.method, r.m, 'Remboursement d''acompte', auth.uid());
        end if;
      end loop;
    else
      update public.orders set retained_amount = v_net where id = _order;
    end if;
  end if;
  update public.orders set status = 'annulee', cancelled_at = now(), cancel_reason = left(btrim(_reason), 300), updated_at = now() where id = _order;
  perform public._refresh_order(_order);
end $$;

create or replace function public.get_period_report(_shop uuid, _from date, _to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_tz text; t0 timestamptz; t1 timestamptz; p0 timestamptz; v_days int; v_cur jsonb; v_prev jsonb;
begin
  perform public._assert_member(_shop);
  if _from is null or _to is null or _to < _from then raise exception 'Période invalide.' using errcode = 'GS422'; end if;
  v_days := _to - _from + 1;
  if v_days > 366 then raise exception 'La période ne peut pas dépasser un an.' using errcode = 'GS422'; end if;
  v_tz := public._shop_tz(_shop);
  t0 := _from::timestamp at time zone v_tz;
  t1 := (_to + 1)::timestamp at time zone v_tz;
  p0 := (_from - v_days)::timestamp at time zone v_tz;

  select jsonb_build_object(
    'gross', coalesce(sum(s.subtotal), 0), 'discounts', coalesce(sum(s.discount_total), 0), 'net', coalesce(sum(s.total), 0),
    'cost', coalesce(sum(s.cost_total), 0), 'margin', coalesce(sum(s.margin), 0), 'count', count(*),
    'unreliable', count(*) filter (where s.has_unreliable_margin),
    'new_receivables', coalesce(sum(s.amount_due), 0))
    into v_cur from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.created_at >= t0 and s.created_at < t1;

  select jsonb_build_object('net', coalesce(sum(s.total), 0), 'margin', coalesce(sum(s.margin), 0), 'count', count(*))
    into v_prev from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.created_at >= p0 and s.created_at < t0;

  return v_cur || jsonb_build_object(
    'from', _from, 'to', _to,
    'receipts', (select coalesce(sum(case when pa.direction = 'in' then pa.amount else -pa.amount end), 0) from public.payments pa
                  where pa.shop_id = _shop and pa.created_at >= t0 and pa.created_at < t1),
    'prev_receipts', (select coalesce(sum(case when pa.direction = 'in' then pa.amount else -pa.amount end), 0) from public.payments pa
                  where pa.shop_id = _shop and pa.created_at >= p0 and pa.created_at < t0),
    'receipts_by_method', (select coalesce(jsonb_agg(jsonb_build_object('method', x.method, 'amount', x.amt) order by x.amt desc), '[]'::jsonb) from (
        select pa.method, sum(case when pa.direction = 'in' then pa.amount else -pa.amount end) as amt from public.payments pa
         where pa.shop_id = _shop and pa.created_at >= t0 and pa.created_at < t1 group by pa.method) x where x.amt <> 0),
    'losses', (select coalesce(sum(m.value), 0) from public.stock_movements m where m.shop_id = _shop and m.type = 'adjustment' and m.quantity < 0 and m.created_at >= t0 and m.created_at < t1),
    'gains', (select coalesce(sum(m.value), 0) from public.stock_movements m where m.shop_id = _shop and m.type = 'adjustment' and m.quantity > 0 and m.created_at >= t0 and m.created_at < t1),
    'retained', (select coalesce(sum(o.retained_amount), 0) from public.orders o where o.shop_id = _shop and o.status = 'annulee' and o.cancelled_at >= t0 and o.cancelled_at < t1),
    'prev', v_prev,
    'series', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'net', coalesce(x.net, 0), 'margin', coalesce(x.margin, 0), 'count', coalesce(x.cnt, 0)) order by d), '[]'::jsonb)
       from generate_series(_from::timestamp, _to::timestamp, interval '1 day') d
       left join (select (s.created_at at time zone v_tz)::date as day, sum(s.total) net, sum(s.margin) margin, count(*) cnt
                    from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.created_at >= t0 and s.created_at < t1 group by 1) x on x.day = d::date),
    'top_products', (select coalesce(jsonb_agg(x order by x.margin desc), '[]'::jsonb) from (
        select sl.product_name as name, sum(sl.line_net) as revenue, sum(sl.line_margin) as margin, sum(sl.base_quantity) as qty, count(distinct sl.sale_id) as sales
          from public.sale_lines sl join public.sales s on s.id = sl.sale_id
         where s.shop_id = _shop and s.status = 'validated' and s.created_at >= t0 and s.created_at < t1
         group by sl.product_name order by sum(sl.line_margin) desc limit 10) x),
    'top_customers', (select coalesce(jsonb_agg(x order by x.revenue desc), '[]'::jsonb) from (
        select c.name, sum(s.total) as revenue, sum(s.margin) as margin, count(*) as sales
          from public.sales s join public.customers c on c.id = s.customer_id
         where s.shop_id = _shop and s.status = 'validated' and s.created_at >= t0 and s.created_at < t1
         group by c.id, c.name order by sum(s.total) desc limit 5) x)
  );
end $$;

create or replace function public.get_dashboard(_shop uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_tz text; d0 timestamptz; m0 timestamptz; v_today date;
begin
  perform public._assert_member(_shop);
  v_tz := public._shop_tz(_shop);
  v_today := (now() at time zone v_tz)::date;
  d0 := v_today::timestamp at time zone v_tz;
  m0 := date_trunc('month', v_today::timestamp) at time zone v_tz;
  return jsonb_build_object(
    'today', (select jsonb_build_object('net', coalesce(sum(s.total),0), 'margin', coalesce(sum(s.margin),0), 'count', count(*))
               from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.created_at >= d0),
    'today_receipts', (select coalesce(sum(case when pa.direction='in' then pa.amount else -pa.amount end),0) from public.payments pa where pa.shop_id = _shop and pa.created_at >= d0),
    'month', (select jsonb_build_object('net', coalesce(sum(s.total),0), 'margin', coalesce(sum(s.margin),0), 'count', count(*))
               from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.created_at >= m0),
    'stock_value', (select coalesce(round(sum(greatest(a.stock_qty,0) * a.avg_cost)),0) from public.articles a join public.products p on p.id = a.product_id
                     where a.shop_id = _shop and p.is_stocked and a.archived_at is null and p.archived_at is null),
    'retail_value', (select coalesce(round(sum(greatest(a.stock_qty,0) * a.price_retail)),0) from public.articles a join public.products p on p.id = a.product_id
                     where a.shop_id = _shop and p.is_stocked and a.archived_at is null and p.archived_at is null),
    'product_count', (select count(*) from public.products p where p.shop_id = _shop and p.archived_at is null),
    'low_stock', (select coalesce(jsonb_agg(x order by x.available_qty), '[]'::jsonb) from (
        select st.id, st.product_id, st.product_name, st.variant_name, st.base_unit, st.available_qty, st.low_stock_threshold
          from public.article_stock st where st.shop_id = _shop and st.is_stocked and st.archived_at is null and st.product_archived_at is null
           and st.available_qty <= st.low_stock_threshold order by st.available_qty limit 8) x),
    'low_stock_count', (select count(*) from public.article_stock st where st.shop_id = _shop and st.is_stocked and st.archived_at is null and st.product_archived_at is null and st.available_qty <= st.low_stock_threshold and st.available_qty > 0),
    'out_of_stock_count', (select count(*) from public.article_stock st where st.shop_id = _shop and st.is_stocked and st.archived_at is null and st.product_archived_at is null and st.available_qty <= 0),
    'receivables', (select coalesce(sum(s.amount_due),0) from public.sales s where s.shop_id = _shop and s.status = 'validated'),
    'receivable_customers', (select count(distinct s.customer_id) from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.amount_due > 0),
    'open_orders', (select count(*) from public.orders o where o.shop_id = _shop and o.status in ('en_attente','confirmee','preparee')),
    'late_orders', (select count(*) from public.orders o where o.shop_id = _shop and o.status in ('en_attente','confirmee','preparee') and o.expected_date < v_today),
    'advances', (select coalesce(sum(o.deposit_total),0) from public.orders o where o.shop_id = _shop and o.status in ('en_attente','confirmee','preparee')),
    'recent_sales', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
        select s.id, s.number, s.total, s.amount_due, s.status, s.created_at, c.name as customer_name
          from public.sales s left join public.customers c on c.id = s.customer_id
         where s.shop_id = _shop order by s.created_at desc limit 6) x),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'net', coalesce(x.net,0), 'margin', coalesce(x.margin,0)) order by d), '[]'::jsonb)
       from generate_series((v_today - 13)::timestamp, v_today::timestamp, interval '1 day') d
       left join (select (s.created_at at time zone v_tz)::date as day, sum(s.total) net, sum(s.margin) margin
                    from public.sales s where s.shop_id = _shop and s.status = 'validated' and s.created_at >= (v_today - 13)::timestamp at time zone v_tz group by 1) x on x.day = d::date)
  );
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in (
              '_assert_can_write','_assert_member','_shop_tz','_next_number','_next_sku','_apply_movement','_insert_article',
              '_resolve_lines','_insert_sale','_refresh_sale','_refresh_order','_add_payments','handle_new_user',
              'categories_validate','products_validate','packagings_validate','articles_normalize','customers_normalize','touch_updated_at',
              'create_shop','create_product','add_article','delete_product','record_purchase','adjust_stock','create_sale',
              'record_sale_payment','settle_customer','cancel_sale','create_order','set_order_status','add_order_deposit',
              'deliver_order','cancel_order','get_period_report','get_dashboard','is_shop_member','shop_is_writable','can_write_shop') loop
    execute format('revoke all on function %s from public, anon', f.sig);
    if f.proname in ('create_shop','create_product','add_article','delete_product','record_purchase','adjust_stock','create_sale',
                     'record_sale_payment','settle_customer','cancel_sale','create_order','set_order_status','add_order_deposit',
                     'deliver_order','cancel_order','get_period_report','get_dashboard','is_shop_member','shop_is_writable','can_write_shop') then
      execute format('grant execute on function %s to authenticated', f.sig);
    else
      execute format('revoke all on function %s from authenticated', f.sig);
    end if;
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;