-- Chamkani Gathering Hall — core schema + RLS
-- Two roles only: ADMIN, STAFF. Permissions are enforced here (DB level),
-- not just in the application layer.

CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE booking_status AS ENUM ('HOLD', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED');
CREATE TYPE booking_shift AS ENUM ('DAY', 'NIGHT');
CREATE TYPE reminder_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- =========================================================================
-- Tables
-- =========================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  -- Always populated (Supabase Auth requires an email). For Admin this is
  -- their real address; for Staff it's a synthetic
  -- "<username>@staff.chamkani.internal" address derived from `username`,
  -- since Staff log in with a username, not a real email.
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'STAFF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (lower(username)) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  address TEXT,
  -- Who referred this customer (a trust/introduction contact common in
  -- hall bookings) — not the customer's own contact.
  reference_name TEXT,
  reference_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  day_name TEXT NOT NULL DEFAULT '',
  shift booking_shift NOT NULL,
  -- Nullable: a Hold only needs a customer + date, not an event type yet.
  -- Required by the time it's Confirmed — enforced below.
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
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
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

-- Only one active booking (HOLD or CONFIRMED) may hold a given date/shift
-- at a time. Once a slot is taken — even just tentatively — no second
-- booking can be created for it until the first is cancelled/rejected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_slot
  ON bookings (booking_date, shift)
  WHERE status IN ('HOLD', 'CONFIRMED');

-- Lookup values (event types, etc). Named reference_values, not
-- "references" — that is a reserved SQL keyword and unsafe to use unquoted.
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

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_booking_id ON whatsapp_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_status ON whatsapp_reminders(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_booking_id ON activity_logs(booking_id);

-- =========================================================================
-- updated_at triggers
-- =========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate a human-friendly booking number (BK-000001, ...) so the
-- application never has to compute or race on it.
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK-' || LPAD(nextval('booking_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_number
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Automatically derive the day name from booking_date. This has to be a
-- trigger rather than a GENERATED column: to_char() is STABLE, not
-- IMMUTABLE (its output can depend on session locale), and Postgres
-- rejects non-immutable expressions in generated columns.
CREATE OR REPLACE FUNCTION set_booking_day_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.day_name := to_char(NEW.booking_date, 'FMDay');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_day_name
BEFORE INSERT OR UPDATE OF booking_date ON bookings
FOR EACH ROW EXECUTE FUNCTION set_booking_day_name();

-- =========================================================================
-- Role helper functions
--
-- SECURITY DEFINER so the lookup bypasses RLS entirely (no recursion risk
-- from the `users` policies below) and every policy can share one
-- definition of "who is the caller".
-- =========================================================================

CREATE OR REPLACE FUNCTION current_app_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT current_app_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION is_app_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT current_app_role() IS NOT NULL;
$$;

-- =========================================================================
-- Row Level Security
--
-- Staff account creation/deactivation always goes through the
-- service-role key from a server-only admin action (it must call
-- supabase.auth.admin.createUser, which RLS cannot govern), but the
-- policies below still lock down the `users` table for any normal
-- session-bound client, defense in depth.
-- =========================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_reminders ENABLE ROW LEVEL SECURITY;

-- ---- users ----

CREATE POLICY "users_select_self_or_admin"
ON users FOR SELECT
USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "users_insert_admin_only"
ON users FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "users_update_admin_only"
ON users FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "users_delete_admin_only"
ON users FOR DELETE
USING (is_admin());

-- ---- customers ----
-- Both roles can read and create. Only Admin can edit/delete an existing
-- customer record.

CREATE POLICY "customers_select_app_users"
ON customers FOR SELECT
USING (is_app_user());

CREATE POLICY "customers_insert_app_users"
ON customers FOR INSERT
WITH CHECK (is_app_user());

CREATE POLICY "customers_update_admin_only"
ON customers FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "customers_delete_admin_only"
ON customers FOR DELETE
USING (is_admin());

-- ---- bookings ----
-- Both roles can read. Staff may only INSERT a new booking as HOLD,
-- attributed to themselves. Staff can never UPDATE or DELETE a booking
-- once it exists — including their own HOLD entries, cancellations, or
-- confirmed bookings. Only Admin can edit, confirm, cancel, reject, or
-- delete.

CREATE POLICY "bookings_select_app_users"
ON bookings FOR SELECT
USING (is_app_user());

CREATE POLICY "bookings_insert_admin_or_staff_hold"
ON bookings FOR INSERT
WITH CHECK (
  is_admin()
  OR (
    current_app_role() = 'STAFF'
    AND status = 'HOLD'
    AND created_by = current_app_user_id()
    AND confirmed_by IS NULL
  )
);

CREATE POLICY "bookings_update_admin_only"
ON bookings FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "bookings_delete_admin_only"
ON bookings FOR DELETE
USING (is_admin());

-- ---- reference_values ----

CREATE POLICY "reference_values_select_app_users"
ON reference_values FOR SELECT
USING (is_app_user());

CREATE POLICY "reference_values_insert_admin_only"
ON reference_values FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "reference_values_update_admin_only"
ON reference_values FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "reference_values_delete_admin_only"
ON reference_values FOR DELETE
USING (is_admin());

-- ---- activity_logs ----
-- Any app user can log their own action (used to audit what staff do,
-- since they cannot self-edit records after the fact). Only Admin can read
-- the audit trail.

CREATE POLICY "activity_logs_select_admin_only"
ON activity_logs FOR SELECT
USING (is_admin());

CREATE POLICY "activity_logs_insert_app_users"
ON activity_logs FOR INSERT
WITH CHECK (
  is_app_user()
  AND (user_id = current_app_user_id() OR is_admin())
);

-- ---- whatsapp_reminders ----
-- Both roles can view reminder status. Only Admin (or the service-role
-- cron sender, which bypasses RLS) can create/modify reminders.

CREATE POLICY "whatsapp_reminders_select_app_users"
ON whatsapp_reminders FOR SELECT
USING (is_app_user());

CREATE POLICY "whatsapp_reminders_insert_admin_only"
ON whatsapp_reminders FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "whatsapp_reminders_update_admin_only"
ON whatsapp_reminders FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "whatsapp_reminders_delete_admin_only"
ON whatsapp_reminders FOR DELETE
USING (is_admin());

-- =========================================================================
-- Seed lookup values
-- =========================================================================

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
