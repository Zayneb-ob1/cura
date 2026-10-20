-- Keep only the patient initials as review names (drop the " — Doctoranytime" suffix).
UPDATE reviews SET name = REPLACE(name, ' — Doctoranytime', ''), updated_at = CURRENT_TIMESTAMP(3) WHERE id LIKE 'doctoranytime-%';
