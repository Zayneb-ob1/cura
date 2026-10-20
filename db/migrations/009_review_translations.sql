-- Translation of each review into the other site language, shown when the visitor reads the site in that language.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS quote_translation TEXT NULL AFTER quote;

-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Snel geholpen en zorg op maat' WHERE id = 'doctoranytime-2026-05-12-la';
-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Zeer goede ervaring' WHERE id = 'doctoranytime-2026-04-16-oe';
-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Je suis très satisfait, j’y retournerai sans hésiter et j’emmènerai aussi mon fils. Je peux de nouveau tout manger. Bravo au dentiste. Merci beaucoup.' WHERE id = 'doctoranytime-2026-03-06-ea';
-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Onberispelijke service' WHERE id = 'doctoranytime-2025-10-13-oa';
-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Zachte tandarts die uitleg geeft over de behandelingen, geruststellend' WHERE id = 'doctoranytime-2025-10-10-er';
-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Professioneel en menselijk' WHERE id = 'doctoranytime-2025-08-03-ae';
-- statement-breakpoint
UPDATE reviews SET quote_translation = 'Op tijd, zelfs vroeger, en zeer professioneel' WHERE id = 'doctoranytime-2025-07-24-sa';
