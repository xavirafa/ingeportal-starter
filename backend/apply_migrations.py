"""
apply_migrations.py — Aplica migraciones SQL pendientes a la base de datos.

Uso:
  python apply_migrations.py [--db-url URL] [--migrations-dir PATH] [--dry-run]

Argumentos opcionales:
  --db-url         URL de la BD (default: lee DATABASE_URL del .env)
  --migrations-dir Carpeta con archivos .sql (default: ../migrations)
  --dry-run        Solo muestra qué aplicaría, sin ejecutar nada

Como funciona:
  1. Verifica que exista la tabla 'schema_migrations' en la BD.
  2. Lee todos los archivos .sql en migrations/ (orden alfabetico).
  3. Para cada archivo que NO este en schema_migrations, lo ejecuta.
  4. Registra cada migracion aplicada con timestamp.
"""

import os, sys, argparse
from pathlib import Path
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Carpeta de migraciones relativa a este script
DEFAULT_MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"

def get_db_url():
    """Lee DATABASE_URL del archivo .env del backend."""
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        print("ERROR: No se encontro backend/.env")
        sys.exit(1)
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip()
    print("ERROR: DATABASE_URL no encontrada en .env")
    sys.exit(1)

def conectar(db_url):
    """Conecta a PostgreSQL usando la URL dada."""
    try:
        return psycopg2.connect(db_url)
    except Exception as e:
        print(f"ERROR conectando a la BD: {e}")
        sys.exit(1)

def asegurar_tabla(conn):
    """Verifica que la tabla schema_migrations exista."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'schema_migrations'
            )
        """)
        existe = cur.fetchone()[0]
    if not existe:
        print("ERROR: La tabla 'schema_migrations' no existe en la BD.")
        print("       Aplica primero la migracion 0001_initial_schema.sql manualmente:")
        print("       psql -U usuario -d miproyecto -f migrations/0001_initial_schema.sql")
        sys.exit(1)

def migraciones_aplicadas(conn):
    """Retorna set de nombres de archivos ya aplicados."""
    with conn.cursor() as cur:
        cur.execute("SELECT filename FROM schema_migrations ORDER BY filename")
        return {row[0] for row in cur.fetchall()}

def listar_archivos(migrations_dir):
    """Retorna lista ordenada de archivos .sql en la carpeta de migraciones."""
    p = Path(migrations_dir)
    if not p.exists():
        print(f"ERROR: carpeta de migraciones no existe: {p}")
        sys.exit(1)
    return sorted(f for f in p.iterdir() if f.suffix == ".sql" and f.is_file())

def aplicar_migracion(conn, archivo):
    """Ejecuta el SQL del archivo y registra en schema_migrations."""
    sql = archivo.read_text(encoding="utf-8").strip()
    if not sql:
        print(f"  [omitido] {archivo.name} (vacio)")
        return
    with conn.cursor() as cur:
        cur.execute(sql)
        cur.execute(
            "INSERT INTO schema_migrations (filename) VALUES (%s)",
            (archivo.name,)
        )
    conn.commit()

def main():
    parser = argparse.ArgumentParser(description="Aplica migraciones SQL pendientes")
    parser.add_argument("--db-url",         default=None,                   help="URL de la BD")
    parser.add_argument("--migrations-dir", default=DEFAULT_MIGRATIONS_DIR, help="Carpeta con .sql")
    parser.add_argument("--dry-run",        action="store_true",            help="Solo muestra, no ejecuta")
    args = parser.parse_args()

    db_url = args.db_url or get_db_url()
    migrations_dir = Path(args.migrations_dir)

    print(f"\nMigraciones: {migrations_dir}")
    print(f"BD:          {db_url.split('@')[-1]}")  # Oculta credenciales
    if args.dry_run:
        print("MODO: dry-run (no se ejecuta nada)\n")

    conn = conectar(db_url)
    asegurar_tabla(conn)

    aplicadas  = migraciones_aplicadas(conn)
    archivos   = listar_archivos(migrations_dir)
    pendientes = [f for f in archivos if f.name not in aplicadas]

    if not pendientes:
        print("  Todo al dia, no hay migraciones pendientes.\n")
        conn.close()
        return 0

    print(f"  {len(pendientes)} migracion(es) pendiente(s):\n")

    errores = 0
    for archivo in pendientes:
        print(f"  Aplicando: {archivo.name} ...", end=" ", flush=True)
        if args.dry_run:
            print("[dry-run, omitido]")
            continue
        try:
            aplicar_migracion(conn, archivo)
            print("OK")
        except Exception as e:
            print(f"ERROR\n    {e}")
            conn.rollback()
            errores += 1
            print("  Deteniendo — corrige el error antes de continuar.")
            break

    conn.close()

    if errores:
        print(f"\n  {errores} error(es). Deploy abortado.\n")
        return 1

    if not args.dry_run:
        print(f"\n  {len(pendientes)} migracion(es) aplicada(s) correctamente.\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
