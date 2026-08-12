-- ============================================================================
-- 20260811000012_acceso_sin_login.sql
--
-- La app definitiva NO tiene pantalla de login: es una herramienta interna de
-- una sola persona (la cooperativa), operada desde el celular con la key
-- publica ("publishable key") de Supabase. Esa key llega a Postgres como el
-- rol `anon`.
--
-- Las politicas de la migracion 20260811000009_rls.sql (admin/operador/
-- consulta via `usuarios`/`rol_actual()`) quedan intactas pero sin uso real,
-- porque nunca hay una sesion de auth.users detras de una request de esta
-- app. Esta migracion agrega politicas PERMISIVAS adicionales para `anon`
-- (en Postgres, las politicas del mismo comando se combinan con OR, asi que
-- esto no rompe nada de lo anterior, solo abre una puerta mas).
--
-- ATENCION - TRADEOFF DE SEGURIDAD:
-- Cualquiera que tenga la URL del proyecto + esta key publica puede leer y
-- escribir personas/prestamos/inversiones/movimientos. Es aceptable para una
-- app privada de un solo operador, pero si esto se expone publicamente o
-- crece a mas usuarios, hay que volver a poner autenticacion real.
--
-- movimientos sigue sin politica de DELETE para nadie (ni siquiera anon):
-- el append-only se mantiene con doble seguro (trigger + ausencia de policy).
-- ============================================================================

grant usage on schema public to anon;

-- ----------------------------------------------------------------------------
-- Catalogos: la app nueva no tiene pantallas de administracion, solo lee.
-- ----------------------------------------------------------------------------
grant select on public.tipos_movimiento  to anon;
grant select on public.categorias        to anon;
grant select on public.parametros        to anon;
grant select on public.periodos_cerrados to anon;

create policy anon_select_tipos_movimiento  on public.tipos_movimiento  for select to anon using (true);
create policy anon_select_categorias        on public.categorias        for select to anon using (true);
create policy anon_select_parametros        on public.parametros        for select to anon using (true);
create policy anon_select_periodos_cerrados on public.periodos_cerrados for select to anon using (true);

-- ----------------------------------------------------------------------------
-- personas: alta/edicion desde "Persona nueva" y desde el detalle.
-- ----------------------------------------------------------------------------
grant select, insert, update on public.personas to anon;

create policy anon_select_personas on public.personas for select to anon using (true);
create policy anon_insert_personas on public.personas for insert to anon with check (true);
create policy anon_update_personas on public.personas for update to anon using (true) with check (true);

-- ----------------------------------------------------------------------------
-- prestamos + tasas_prestamo
-- ----------------------------------------------------------------------------
grant select, insert, update on public.prestamos      to anon;
grant select, insert, update on public.tasas_prestamo  to anon;

create policy anon_select_prestamos on public.prestamos for select to anon using (true);
create policy anon_insert_prestamos on public.prestamos for insert to anon with check (true);
create policy anon_update_prestamos on public.prestamos for update to anon using (true) with check (true);

create policy anon_select_tasas_prestamo on public.tasas_prestamo for select to anon using (true);
create policy anon_insert_tasas_prestamo on public.tasas_prestamo for insert to anon with check (true);
create policy anon_update_tasas_prestamo on public.tasas_prestamo for update to anon using (true) with check (true);

-- ----------------------------------------------------------------------------
-- inversiones + tramos_inversion
-- ----------------------------------------------------------------------------
grant select, insert, update on public.inversiones      to anon;
grant select, insert, update on public.tramos_inversion to anon;

create policy anon_select_inversiones on public.inversiones for select to anon using (true);
create policy anon_insert_inversiones on public.inversiones for insert to anon with check (true);
create policy anon_update_inversiones on public.inversiones for update to anon using (true) with check (true);

create policy anon_select_tramos_inversion on public.tramos_inversion for select to anon using (true);
create policy anon_insert_tramos_inversion on public.tramos_inversion for insert to anon with check (true);
create policy anon_update_tramos_inversion on public.tramos_inversion for update to anon using (true) with check (true);

-- ----------------------------------------------------------------------------
-- movimientos: select/insert/update(solo confirmado, via trigger). Sin delete.
-- ----------------------------------------------------------------------------
grant select, insert, update on public.movimientos to anon;

create policy anon_select_movimientos on public.movimientos for select to anon using (true);
create policy anon_insert_movimientos on public.movimientos for insert to anon with check (true);
create policy anon_update_movimientos on public.movimientos for update to anon using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Vistas: mismo mecanismo que ya usaban admin/operador/consulta (el owner de
-- las tablas queda exento de su propia RLS), solo falta el GRANT a anon.
-- ----------------------------------------------------------------------------
grant select on public.v_saldos_prestamo    to anon;
grant select on public.v_saldos_inversion   to anon;
grant select on public.v_flujo_caja         to anon;
grant select on public.v_flujo_caja_detalle to anon;
grant select on public.v_cartera_por_estado to anon;
grant select on public.v_estado_resultados  to anon;
grant select on public.v_resultado_detalle  to anon;
grant select on public.v_flujo_mensual      to anon;
grant select on public.v_mora               to anon;
