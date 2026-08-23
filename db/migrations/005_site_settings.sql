CREATE TABLE IF NOT EXISTS site_settings (
  id TINYINT UNSIGNED PRIMARY KEY,
  phone_display VARCHAR(50) NOT NULL DEFAULT '',
  phone_dial VARCHAR(50) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  schedule_fr VARCHAR(120) NOT NULL DEFAULT '',
  schedule_nl VARCHAR(120) NOT NULL DEFAULT '',
  emergency_fr VARCHAR(160) NOT NULL DEFAULT '',
  emergency_nl VARCHAR(160) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint
INSERT IGNORE INTO site_settings (
  id, phone_display, phone_dial, email, schedule_fr, schedule_nl, emergency_fr, emergency_nl
) VALUES (
  1,
  '+32 (0)11 00 00 00',
  '+3211000000',
  'info@cura-tandarts.be',
  'Lun–Ven 8h30–18h00',
  'Ma–Vr 8u30–18u00',
  'Urgences : appelez avant 10h',
  'Spoed: bel vóór 10u'
);
