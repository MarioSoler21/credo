# Esquema Supabase — Cooperativa de préstamos e inversiones (HNL)

Esquema estrella: una tabla de hechos append-only (`movimientos`) + tablas de catálogo/dimensión. Ningún saldo se guarda como columna — todos son vistas (`v_*`).

## Archivos (orden de aplicación)

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `20260811000001_extensions_y_roles.sql` | `btree_gist`, tabla `usuarios` (mapeo auth.users → rol), función `rol_actual()` |
| 2 | `20260811000002_catalogos.sql` | `tipos_movimiento`, `categorias`, `parametros`, `periodos_cerrados` |
| 3 | `20260811000003_personas.sql` | `personas` + trigger `updated_at` |
| 4 | `20260811000004_prestamos.sql` | `prestamos`, `tasas_prestamo` (con exclude constraint anti-traslape) |
| 5 | `20260811000005_inversiones.sql` | `inversiones`, `tramos_inversion` |
| 6 | `20260811000006_movimientos.sql` | Tabla de hechos `movimientos` |
| 7 | `20260811000007_triggers_movimientos.sql` | Bloqueo DELETE, bloqueo UPDATE (solo `confirmado`), bloqueo por período cerrado |
| 8 | `20260811000008_vistas.sql` | `v_saldos_prestamo`, `v_saldos_inversion`, `v_flujo_caja`, `v_cartera_por_estado`, `v_estado_resultados`, `v_flujo_mensual`, `v_mora` |
| 9 | `20260811000009_rls.sql` | RLS por rol (`admin`/`operador`/`consulta`) + grants |
| 10 | `20260811000010_seed_catalogos.sql` | Semilla de `tipos_movimiento`, `categorias`, `parametros` |
| 11 | `20260811000011_seed_movimientos_EJEMPLO.sql` | **Placeholder** — faltan los 64 movimientos reales (ver abajo) |

Con Supabase CLI:

```bash
supabase db reset      # aplica todas las migraciones en orden + supabase/seed.sql si existe
# o, contra un proyecto remoto:
supabase db push
```

## Cómo funcionan los roles (RLS)

- **admin**: acceso total.
- **operador**: `INSERT` en `movimientos`; `INSERT`/`UPDATE` en `personas` y `prestamos`; `SELECT` en el resto de tablas base.
- **consulta**: **sin** políticas de `SELECT` en tablas base → no puede leerlas directamente. Solo puede leer las vistas `v_*`, porque las vistas son propiedad del owner de las tablas (quien corre las migraciones) y Postgres exime al owner de una tabla de su propia RLS (no se usó `FORCE ROW LEVEL SECURITY`). Por eso las vistas devuelven datos completos a cualquier usuario autenticado con `GRANT SELECT`, sin filtrar por rol.

Para asignar un rol a un usuario:

```sql
insert into public.usuarios (id, rol) values ('<uuid-de-auth.users>', 'operador');
```

⚠️ La primera fila de `usuarios` (el primer `admin`) debe insertarse desde el **SQL Editor de Supabase** o usando la `service_role` key, porque las políticas de esa tabla exigen ya ser `admin` para poder insertar (bootstrap clásico de RLS).

## Reglas append-only

- `DELETE` en `movimientos`: siempre rechazado por trigger (y sin política RLS de `delete`, doble bloqueo).
- `UPDATE` en `movimientos`: el trigger rechaza cualquier cambio que no sea la columna `confirmado`.
- Correcciones: insertar una nueva fila con `reversa_de = id_original`.
- Insertar con `fecha` dentro de un `(anio, mes)` marcado `cerrado = true` en `periodos_cerrados`: rechazado por trigger.

## ⚠️ Pendiente: los 64 movimientos históricos

La prueba de aceptación pide que, con los 64 movimientos históricos cargados:

- `v_flujo_caja` = **1976.12**
- `v_cartera_por_estado` → `ACTIVO 19850.00`, `CONGELADO 6300.00`, `INCOBRABLE 32260.00`, `PAGADO 0.00`

El detalle de esos 64 movimientos (personas, préstamos/inversiones, tipo, fecha, monto) no se incluyó en la solicitud, así que **no se pueden inventar** sin arriesgar que no coincidan con los montos reales. `20260811000011_seed_movimientos_EJEMPLO.sql` queda como plantilla/placeholder.

Para completarlo, comparta el detalle (CSV/Excel/tabla) de los 64 movimientos y se generan los `INSERT` reales, además de una consulta de verificación tipo:

```sql
select * from public.v_flujo_caja;
select * from public.v_cartera_por_estado order by estado;
```

para confirmar que cuadran exactamente con los valores de la prueba de aceptación.
