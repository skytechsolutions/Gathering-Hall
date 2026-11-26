-- =========================================================================
-- Chamkani Gathering Hall — PostgreSQL Schema for pgAdmin 4
-- Compatible with PostgreSQL 13, 14, 15, 16, 17, 18+
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Custom Enum Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('HOLD', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_shift AS ENUM ('DAY', 'NIGHT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table (Native Auth with Password Hash)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'STAFF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (lower(username)) WHERE username IS NOT NULL;

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  address TEXT,
  reference_name TEXT,
  reference_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bookings Table
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  day_name TEXT NOT NULL DEFAULT '',
  shift booking_shift NOT NULL,
  event_type TEXT,
  status booking_status NOT NULL DEFAULT 'HOLD',
  guest_count INTEGER NOT NULL DEFAULT 0,
  male_waiter_required BOOLEAN NOT NULL DEFAULT FALSE,
  male_waiter_quantity INTEGER NOT NULL DEFAULT 0,
  female_waiter_required BOOLEAN NOT NULL DEFAULT FALSE,
  female_waiter_quantity INTEGER NOT NULL DEFAULT 0,
  dj_required BOOLEAN NOT NULL DEFAULT FALSE,
  stage_required BOOLEAN NOT NULL DEFAULT FALSE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_guest_count_check CHECK (guest_count >= 0),
  CONSTRAINT booking_paid_check CHECK (paid_amount >= 0),
  CONSTRAINT booking_advance_check CHECK (advance_amount >= 0),
  CONSTRAINT booking_total_check CHECK (total_amount >= 0),
  CONSTRAINT booking_paid_not_over_total_check CHECK (paid_amount <= total_amount),
  CONSTRAINT booking_male_waiter_qty_check CHECK (
    (male_waiter_required = FALSE AND male_waiter_quantity = 0) OR
    (male_waiter_required = TRUE AND male_waiter_quantity >= 1)
  ),
  CONSTRAINT booking_female_waiter_qty_check CHECK (
    (female_waiter_required = FALSE AND female_waiter_quantity = 0) OR
    (female_waiter_required = TRUE AND female_waiter_quantity >= 1)
  ),
  CONSTRAINT booking_confirmed_requires_event_type CHECK (status <> 'CONFIRMED' OR event_type IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_slot
  ON bookings (booking_date, shift)
  WHERE status IN ('HOLD', 'CONFIRMED');

-- 5. Reference Values Table (Lookup values)
CREATE TABLE IF NOT EXISTS reference_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key, category)
);

-- 6. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. WhatsApp Reminders Table
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status reminder_status NOT NULL DEFAULT 'PENDING',
  message_template TEXT,
  provider_message_id TEXT,
  payload JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Cloudinary Media Uploads Table
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL,
  url TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  format TEXT,
  resource_type TEXT DEFAULT 'image',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_booking_id ON whatsapp_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_status ON whatsapp_reminders(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_booking_id ON activity_logs(booking_id);

-- =========================================================================
-- Triggers and Functions
-- =========================================================================

-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate human-friendly booking number (BK-000001, ...)
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK-' || LPAD(nextval('booking_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_number ON bookings;
CREATE TRIGGER trg_bookings_number
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Auto-derive day name from booking_date (e.g., Friday, Saturday)
CREATE OR REPLACE FUNCTION set_booking_day_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.day_name := to_char(NEW.booking_date, 'FMDay');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_day_name ON bookings;
CREATE TRIGGER trg_bookings_day_name
BEFORE INSERT OR UPDATE OF booking_date ON bookings
FOR EACH ROW EXECUTE FUNCTION set_booking_day_name();

-- =========================================================================
-- Seed Data
-- =========================================================================

-- Reference lookup values
INSERT INTO reference_values (key, value, category, sort_order)
VALUES
  ('MEHNDI', 'Mehndi', 'event_type', 1),
  ('BARAT', 'Barat', 'event_type', 2),
  ('WALIMA', 'Walima', 'event_type', 3),
  ('KHATM', 'Khatm', 'event_type', 4),
  ('AQEEQA', 'Aqeeqa', 'event_type', 5),
  ('HOLD', 'HOLD', 'booking_status', 1),
  ('CONFIRMED', 'CONFIRMED', 'booking_status', 2),
  ('COMPLETED', 'COMPLETED', 'booking_status', 3),
  ('CANCELLED', 'CANCELLED', 'booking_status', 4),
  ('REJECTED', 'REJECTED', 'booking_status', 5),
  ('DAY', 'DAY', 'shift', 1),
  ('NIGHT', 'NIGHT', 'shift', 2)
ON CONFLICT (key, category) DO NOTHING;

-- Seed Default Admin Account:
-- Email: admin@example.com
-- Password: samij7141
INSERT INTO users (email, username, password_hash, full_name, role, is_active)
VALUES (
  'admin@example.com',
  'admin',
  '$2b$10$YiWyAPUYheXI6qvyzJuzdO0VlVtfI0PxtC.LZyKzjKVTVtvbiqZya',
  'Administrator',
  'ADMIN',
  TRUE
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    is_active = TRUE;


-- Seed Sample Demo Customer & Booking
INSERT INTO customers (id, full_name, phone, address, notes)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Haji Muhammad Tariq',
  '+923001234567',
  'Chamkani, Peshawar',
  'First Hall Booking'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookings (
  customer_id,
  booking_date,
  shift,
  event_type,
  status,
  guest_count,
  male_waiter_required,
  male_waiter_quantity,
  female_waiter_required,
  female_waiter_quantity,
  dj_required,
  stage_required,
  total_amount,
  advance_amount,
  paid_amount
)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  CURRENT_DATE + INTERVAL '5 days',
  'NIGHT',
  'Walima',
  'CONFIRMED',
  350,
  TRUE,
  4,
  TRUE,
  2,
  TRUE,
  TRUE,
  150000.00,
  50000.00,
  50000.00
)
ON CONFLICT DO NOTHING;
