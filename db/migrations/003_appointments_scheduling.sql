ALTER TABLE appointments ADD COLUMN slot_time VARCHAR(20) NOT NULL DEFAULT '';
-- statement-breakpoint
ALTER TABLE appointments ADD COLUMN duration_min INT NOT NULL DEFAULT 30;
-- statement-breakpoint
ALTER TABLE appointments ADD COLUMN proposed_day DATE NULL;
-- statement-breakpoint
ALTER TABLE appointments ADD COLUMN proposed_time VARCHAR(20) NULL;
