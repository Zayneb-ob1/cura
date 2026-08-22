CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(50) NOT NULL DEFAULT '',
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  language ENUM('fr', 'nl') NOT NULL DEFAULT 'fr',
  status ENUM('new', 'read', 'archived') NOT NULL DEFAULT 'new',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX contacts_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(191) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  care VARCHAR(200) NOT NULL DEFAULT '',
  day DATE NOT NULL,
  preferred_time VARCHAR(100) NOT NULL DEFAULT '',
  note TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  language ENUM('fr', 'nl') NOT NULL DEFAULT 'fr',
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX appointments_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  quote TEXT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  language ENUM('fr', 'nl') NOT NULL DEFAULT 'fr',
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX reviews_public_idx (language, published, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(191) PRIMARY KEY,
  initials VARCHAR(4) NOT NULL,
  name_fr VARCHAR(120) NOT NULL,
  name_nl VARCHAR(120) NOT NULL,
  role_fr VARCHAR(180) NOT NULL,
  role_nl VARCHAR(180) NOT NULL,
  bio_fr TEXT NOT NULL,
  bio_nl TEXT NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX doctors_public_idx (published, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
