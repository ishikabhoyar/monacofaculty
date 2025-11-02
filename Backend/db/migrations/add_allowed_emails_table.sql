-- Migration: Add allowed_emails table for login whitelist
-- Created: 2025-11-01

-- Create the allowed_emails table
CREATE TABLE IF NOT EXISTS allowed_emails (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_active ON allowed_emails(is_active);

-- Optional: Add some initial emails (uncomment and modify as needed)
-- INSERT INTO allowed_emails (email, notes) VALUES
-- ('admin@example.com', 'System administrator'),
-- ('faculty1@example.com', 'Faculty member');

-- Comment for rollback
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS allowed_emails CASCADE;
