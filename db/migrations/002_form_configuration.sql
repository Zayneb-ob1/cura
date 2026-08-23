CREATE TABLE IF NOT EXISTS form_configs (
  form_type ENUM('contact', 'appointment') PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  title_fr VARCHAR(240) NOT NULL,
  title_nl VARCHAR(240) NOT NULL,
  description_fr TEXT NOT NULL,
  description_nl TEXT NOT NULL,
  submit_label_fr VARCHAR(160) NOT NULL,
  submit_label_nl VARCHAR(160) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX form_configs_slug_idx (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS form_fields (
  form_type ENUM('contact', 'appointment') NOT NULL,
  field_key VARCHAR(64) NOT NULL,
  label_fr VARCHAR(240) NOT NULL,
  label_nl VARCHAR(240) NOT NULL,
  placeholder_fr VARCHAR(500) NOT NULL DEFAULT '',
  placeholder_nl VARCHAR(500) NOT NULL DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (form_type, field_key),
  CONSTRAINT form_fields_config_fk FOREIGN KEY (form_type)
    REFERENCES form_configs (form_type) ON DELETE CASCADE,
  INDEX form_fields_order_idx (form_type, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint
INSERT IGNORE INTO form_configs (
  form_type, slug, enabled, title_fr, title_nl, description_fr, description_nl,
  submit_label_fr, submit_label_nl
) VALUES
  (
    'contact', 'contact', TRUE,
    'Où nous trouver.', 'Waar u ons vindt.',
    'Nous répondons sous 24 h ouvrées.', 'We antwoorden binnen 24 werkuren.',
    'Envoyer le message', 'Bericht versturen'
  ),
  (
    'appointment', 'rendez-vous', TRUE,
    'Réservez votre place en deux minutes.', 'Reserveer uw afspraak in twee minuten.',
    'Choisissez le motif, donnez-nous vos coordonnées et indiquez vos disponibilités. Nous confirmons sous 24 h.',
    'Kies de reden, vul uw gegevens in en geef aan wanneer u beschikbaar bent. We bevestigen binnen 24 uur.',
    'Envoyer ma demande', 'Mijn aanvraag versturen'
  );

-- statement-breakpoint
INSERT IGNORE INTO form_fields (
  form_type, field_key, label_fr, label_nl, placeholder_fr, placeholder_nl,
  is_required, is_visible, display_order
) VALUES
  ('contact', 'name', 'Nom', 'Naam', '', '', TRUE, TRUE, 10),
  ('contact', 'email', 'E-mail', 'E-mail', '', '', TRUE, TRUE, 20),
  ('contact', 'phone', 'Téléphone', 'Telefoon', '', '', FALSE, FALSE, 30),
  ('contact', 'subject', 'Sujet', 'Onderwerp', '', '', TRUE, TRUE, 40),
  ('contact', 'message', 'Message', 'Bericht', '', '', TRUE, TRUE, 50),
  ('appointment', 'care', 'Soin demandé', 'Gewenste behandeling', '', '', FALSE, TRUE, 10),
  ('appointment', 'day', 'Jour préféré', 'Voorkeursdag', '', '', TRUE, TRUE, 20),
  ('appointment', 'time', 'Moment', 'Moment', '', '', FALSE, TRUE, 30),
  ('appointment', 'firstName', 'Prénom', 'Voornaam', '', '', TRUE, TRUE, 40),
  ('appointment', 'lastName', 'Nom', 'Naam', '', '', TRUE, TRUE, 50),
  ('appointment', 'email', 'E-mail', 'E-mail', '', '', TRUE, TRUE, 60),
  ('appointment', 'phone', 'Téléphone', 'Telefoon', '', '', TRUE, TRUE, 70),
  (
    'appointment', 'note', 'Une information utile', 'Nuttige informatie',
    'Douleur, appréhension, mobilité réduite…', 'Pijn, bezorgdheid, beperkte mobiliteit…',
    FALSE, TRUE, 80
  ),
  (
    'appointment', 'consent',
    'J’accepte que le cabinet utilise ces informations pour traiter ma demande.',
    'Ik ga ermee akkoord dat de praktijk deze gegevens gebruikt om mijn aanvraag te behandelen.',
    '', '', TRUE, TRUE, 90
  );
