-- ============================================================================
-- 20260811000007_triggers_movimientos.sql
-- Reglas append-only + bloqueo de periodos cerrados sobre movimientos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) DELETE siempre prohibido. Las correcciones se hacen con una fila de
--    reverso (reversa_de), nunca borrando historia.
-- ----------------------------------------------------------------------------
create or replace function public.movimientos_bloquear_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'movimientos es append-only: no se permite DELETE (id=%). Inserte una fila de reverso con reversa_de = %.',
    old.id, old.id;
end;
$$;

create trigger trg_movimientos_no_delete
before delete on public.movimientos
for each row
execute function public.movimientos_bloquear_delete();

-- ----------------------------------------------------------------------------
-- 2) UPDATE solo puede cambiar la columna "confirmado". Cualquier otro
--    cambio de columna se rechaza.
-- ----------------------------------------------------------------------------
create or replace function public.movimientos_bloquear_update()
returns trigger
language plpgsql
as $$
begin
  if new.id                 is distinct from old.id
     or new.fecha              is distinct from old.fecha
     or new.tipo_movimiento_id is distinct from old.tipo_movimiento_id
     or new.prestamo_id        is distinct from old.prestamo_id
     or new.inversion_id       is distinct from old.inversion_id
     or new.categoria_id       is distinct from old.categoria_id
     or new.monto              is distinct from old.monto
     or new.nota               is distinct from old.nota
     or new.reversa_de         is distinct from old.reversa_de
     or new.created_at         is distinct from old.created_at
     or new.created_by         is distinct from old.created_by
  then
    raise exception
      'movimientos es append-only: solo se permite modificar la columna confirmado (id=%). Use una fila de reverso para corregir.',
      old.id;
  end if;

  return new;
end;
$$;

create trigger trg_movimientos_solo_confirmado
before update on public.movimientos
for each row
execute function public.movimientos_bloquear_update();

-- ----------------------------------------------------------------------------
-- 3) No se puede insertar un movimiento cuyo (anio, mes) de "fecha" ya este
--    en periodos_cerrados con cerrado = true.
-- ----------------------------------------------------------------------------
create or replace function public.movimientos_validar_periodo_abierto()
returns trigger
language plpgsql
as $$
declare
  v_cerrado boolean;
begin
  select cerrado into v_cerrado
  from public.periodos_cerrados
  where anio = extract(year  from new.fecha)::int
    and mes  = extract(month from new.fecha)::int;

  if v_cerrado then
    raise exception
      'El periodo %-% esta cerrado. No se pueden insertar movimientos con fecha %.',
      extract(year from new.fecha), extract(month from new.fecha), new.fecha;
  end if;

  return new;
end;
$$;

create trigger trg_movimientos_periodo_abierto
before insert on public.movimientos
for each row
execute function public.movimientos_validar_periodo_abierto();
