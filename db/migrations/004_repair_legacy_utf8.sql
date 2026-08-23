UPDATE form_configs
SET title_fr = 'Où nous trouver.'
WHERE form_type = 'contact'
  AND BINARY title_fr = X'4fc383c283c382c2b9206e6f75732074726f757665722e';

-- statement-breakpoint
UPDATE form_configs
SET description_fr = 'Nous répondons sous 24 h ouvrées.'
WHERE form_type = 'contact'
  AND BINARY description_fr = X'4e6f75732072c383c283c382c2a9706f6e646f6e7320736f75732032342068206f757672c383c283c382c2a965732e';

-- statement-breakpoint
UPDATE form_fields
SET label_fr = 'Téléphone'
WHERE form_type = 'contact'
  AND field_key = 'phone'
  AND BINARY label_fr = X'54c383c283c382c2a96cc383c283c382c2a970686f6e65';
