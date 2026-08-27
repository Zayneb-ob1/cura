CREATE TABLE IF NOT EXISTS blocked_ips (
  id VARCHAR(191) PRIMARY KEY,
  ip_address VARBINARY(16) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY blocked_ips_address_unique (ip_address),
  INDEX blocked_ips_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
