-- Texts of the public site edited from the dashboard (keys: lib/content-catalog.ts).
CREATE TABLE IF NOT EXISTS site_content (
  content_key VARCHAR(120) PRIMARY KEY,
  value_fr TEXT NOT NULL,
  value_nl TEXT NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
