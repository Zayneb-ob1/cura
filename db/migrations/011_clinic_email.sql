-- Practice e-mail address confirmed by the practice.
UPDATE site_settings SET email = 'contact@curadental.be', updated_at = CURRENT_TIMESTAMP(3) WHERE id = 1;
