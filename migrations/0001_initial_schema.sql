-- 0001_initial_schema.sql
-- Esquema inicial del portal: usuarios, sesiones, seguridad, historial de logins
-- Idempotente: usa IF NOT EXISTS para no fallar si se corre dos veces

-- ── Tabla de seguimiento de migraciones ───────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
    id         SERIAL PRIMARY KEY,
    filename   VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Usuarios ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL       PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(100) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'user',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    allowed_apps    JSONB        NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indices de busqueda frecuente
CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ── Sesiones activas (JWT blacklist + tracking) ────────────────────────────
CREATE TABLE IF NOT EXISTS active_sessions (
    id            SERIAL       PRIMARY KEY,
    user_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id    VARCHAR(36)  NOT NULL UNIQUE,   -- UUID
    jti           VARCHAR(36)  NOT NULL UNIQUE,   -- JWT ID (para invalidar tokens)
    ip_address    VARCHAR(45),
    user_agent    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jti        ON active_sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active  ON active_sessions(is_active);

-- ── Eventos de seguridad (logs de intentos, bloqueos, etc.) ───────────────
CREATE TABLE IF NOT EXISTS security_events (
    id               SERIAL       PRIMARY KEY,
    event_type       VARCHAR(50)  NOT NULL,   -- login_failed, ip_blocked, ip_unblocked, login_success
    ip_address       VARCHAR(45),
    username_attempt VARCHAR(100),
    user_id          INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    details          TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_events_type       ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_ip         ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_sec_events_created_at ON security_events(created_at DESC);

-- ── Historial de logins ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_log (
    id         SERIAL       PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    logged_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_log_user_id  ON login_log(user_id);
CREATE INDEX IF NOT EXISTS idx_login_log_logged_at ON login_log(logged_at DESC);
