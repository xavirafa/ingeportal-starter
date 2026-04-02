# Migraciones de base de datos

Cada archivo `.sql` en esta carpeta es una migración que se aplica **una sola vez** a la BD de producción durante el deploy.

## Reglas

1. **Nombre**: `NNNN_descripcion_corta.sql` donde NNNN es número consecutivo (0001, 0002, ...)
2. **Una vez creado y commiteado, nunca modificar el archivo** — si algo salió mal, creá una nueva migración que corrija.
3. **Idempotente cuando sea posible**: usá `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING` para que no falle si se corre dos veces.
4. **Una migración = un cambio lógico** (no mezclar ALTER TABLE de tablas distintas sin relación).

## Cuándo crear una migración

- Agregar una columna a tabla existente → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
- Crear una tabla nueva que SQLAlchemy no crea automáticamente
- Insertar datos iniciales/catálogo que deben estar en prod
- Cambiar un tipo de dato, agregar un índice, etc.

## Cuándo NO necesitás migración

- Tablas completamente nuevas (SQLAlchemy las crea solas con `create_all` al reiniciar el backend)
- Cambios de código frontend o backend que no tocan la BD

## Ejemplo

```sql
-- 0002_ejemplo_agregar_columna.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
```

## Flujo

```
1. Desarrollás el cambio en dev
2. Creás el archivo migrations/NNNN_descripcion.sql
3. Commiteás y pushás a dev
4. Corrés .\deploy.ps1
   → aplica migraciones pendientes en prod automáticamente
   → luego deploya el código
```
