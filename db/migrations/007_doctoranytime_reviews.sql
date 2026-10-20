-- Real patient reviews copied verbatim from the practice's Doctoranytime profile
-- (doctoranytime.be/d/dentiste/ayoub-khana). Names are kept as initials, like on the source.
-- Ratings out of 10 are converted to the site's 5-star scale (9.3 and 9.7/10 round to 5).
INSERT IGNORE INTO reviews (id, name, quote, rating, language, published, created_at, updated_at) VALUES
  ('doctoranytime-2026-05-12-la', 'L. A. — Doctoranytime', 'Reçu rapidement et soins adaptés', 5, 'fr', TRUE, '2026-05-12 12:00:00.000', '2026-05-12 12:00:00.000'),
  ('doctoranytime-2026-04-16-oe', 'O. E. — Doctoranytime', 'Très bonne expérience', 5, 'fr', TRUE, '2026-04-16 12:00:00.000', '2026-04-16 12:00:00.000'),
  ('doctoranytime-2026-03-06-ea', 'E. A. — Doctoranytime', 'Ik ben zeer tevreden, ik ga zeker terug en neem mijn zoon ook nog mee. Ik kan weer alles eten . Dikke pluim voor de tandarts . Dank je wel .', 5, 'nl', TRUE, '2026-03-06 12:00:00.000', '2026-03-06 12:00:00.000'),
  ('doctoranytime-2025-10-13-oa', 'O. A. — Doctoranytime', 'Service impeccable', 5, 'fr', TRUE, '2025-10-13 12:00:00.000', '2025-10-13 12:00:00.000'),
  ('doctoranytime-2025-10-10-er', 'E. R. — Doctoranytime', 'Dentiste doux et donnant les explications sur les soins qu il fait rassurant', 5, 'fr', TRUE, '2025-10-10 12:00:00.000', '2025-10-10 12:00:00.000'),
  ('doctoranytime-2025-08-03-ae', 'A. E. — Doctoranytime', 'Professionnel et humain', 5, 'fr', TRUE, '2025-08-03 12:00:00.000', '2025-08-03 12:00:00.000'),
  ('doctoranytime-2025-07-24-sa', 'S. A. — Doctoranytime', 'À l’heure même en avance et très professionnel', 5, 'fr', TRUE, '2025-07-24 12:00:00.000', '2025-07-24 12:00:00.000');
