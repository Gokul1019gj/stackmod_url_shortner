-- URL Shortener Service — Database Schema

-- Users table: registered accounts
CREATE TABLE IF NOT EXISTS users (
    id            TEXT     PRIMARY KEY,               -- e.g. UUID or CUID
    name          TEXT,
    email         TEXT     UNIQUE,
    password_hash TEXT,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- URLs table: stores shortened URLs
CREATE TABLE IF NOT EXISTS urls (
    short_code   TEXT     PRIMARY KEY,
    original_url TEXT     NOT NULL,
    user_id      TEXT,                                -- NULL = anonymous URL
    expires_at   DATETIME,                            -- NULL means never expires
    is_active    BOOLEAN  NOT NULL DEFAULT TRUE,      -- FALSE = soft-deleted
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_urls_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_urls_user_id  ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls(is_active);

-- Click events table: append-only analytics log
CREATE TABLE IF NOT EXISTS click_events (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    short_code TEXT     NOT NULL,
    ip_address TEXT,                                  -- IPv4 or IPv6
    country    TEXT,                                  -- ISO 3166-1 alpha-2, e.g. "IN", "US"
    user_agent TEXT,
    clicked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clicks_url FOREIGN KEY (short_code) REFERENCES urls(short_code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clicks_short_code       ON click_events(short_code);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at       ON click_events(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_short_code_time  ON click_events(short_code, clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip               ON click_events(ip_address);
