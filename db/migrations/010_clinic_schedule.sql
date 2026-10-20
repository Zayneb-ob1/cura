-- Opening hours confirmed by the practice: Monday to Friday, 9:00–17:00.
UPDATE site_settings SET schedule_fr = 'Lun–Ven 9h00–17h00', schedule_nl = 'Ma–Vr 9u00–17u00', updated_at = CURRENT_TIMESTAMP(3) WHERE id = 1;
