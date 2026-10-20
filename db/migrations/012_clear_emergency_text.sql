-- The site no longer mentions emergencies.
UPDATE site_settings SET emergency_fr = '', emergency_nl = '', updated_at = CURRENT_TIMESTAMP(3) WHERE id = 1;
