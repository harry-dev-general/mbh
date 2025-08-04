-- =============================================
-- MBH Staff Portal Database Schema
-- =============================================
-- This migration creates all necessary tables for the Manly Boat Hire staff portal
-- including authentication, profiles, and data caching from Airtable

-- 1. Staff Profiles Table
-- Links Supabase auth users with Airtable Employee records
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  airtable_employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_airtable_id ON staff_profiles(airtable_employee_id);
CREATE INDEX idx_staff_profiles_email ON staff_profiles(email);

-- 2. Availability Cache Table
-- Caches weekly availability submissions for quick access
CREATE TABLE IF NOT EXISTS availability_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES staff_profiles(airtable_employee_id),
  week_starting DATE NOT NULL,
  submission_id TEXT UNIQUE,
  monday_available BOOLEAN DEFAULT false,
  monday_from TIME,
  monday_until TIME,
  tuesday_available BOOLEAN DEFAULT false,
  tuesday_from TIME,
  tuesday_until TIME,
  wednesday_available BOOLEAN DEFAULT false,
  wednesday_from TIME,
  wednesday_until TIME,
  thursday_available BOOLEAN DEFAULT false,
  thursday_from TIME,
  thursday_until TIME,
  friday_available BOOLEAN DEFAULT false,
  friday_from TIME,
  friday_until TIME,
  saturday_available BOOLEAN DEFAULT false,
  saturday_from TIME,
  saturday_until TIME,
  sunday_available BOOLEAN DEFAULT false,
  sunday_from TIME,
  sunday_until TIME,
  additional_notes TEXT,
  airtable_record_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, week_starting)
);

-- Indexes for availability queries
CREATE INDEX idx_availability_employee_week ON availability_cache(employee_id, week_starting);
CREATE INDEX idx_availability_week ON availability_cache(week_starting);

-- 3. Bookings Cache Table
-- Caches booking assignments for staff members
CREATE TABLE IF NOT EXISTS booking_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  airtable_booking_id TEXT UNIQUE NOT NULL,
  booking_code TEXT NOT NULL,
  customer_name TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  onboarding_employee_id TEXT REFERENCES staff_profiles(airtable_employee_id),
  deloading_employee_id TEXT REFERENCES staff_profiles(airtable_employee_id),
  vessel_name TEXT,
  vessel_airtable_id TEXT,
  status TEXT,
  onboarding_status TEXT,
  deloading_status TEXT,
  pre_departure_checklist_id TEXT,
  post_departure_checklist_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking queries
CREATE INDEX idx_bookings_date ON booking_cache(booking_date);
CREATE INDEX idx_bookings_onboarding_emp ON booking_cache(onboarding_employee_id, booking_date);
CREATE INDEX idx_bookings_deloading_emp ON booking_cache(deloading_employee_id, booking_date);

-- 4. Checklist Templates Table
-- Stores checklist items for pre/post departure checks
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('pre_departure', 'post_departure')),
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Completed Checklists Table
-- Stores completed checklist data
CREATE TABLE IF NOT EXISTS completed_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL,
  employee_id TEXT NOT NULL REFERENCES staff_profiles(airtable_employee_id),
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('pre_departure', 'post_departure')),
  vessel_id TEXT NOT NULL,
  completed_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  photos TEXT[],
  completion_status TEXT DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  airtable_record_id TEXT,
  synced_to_airtable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. App Settings Table
-- Stores configuration and settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Sync Log Table
-- Tracks synchronization with Airtable
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Staff Profiles: Users can view their own profile, managers/admins can view all
CREATE POLICY "Users can view own profile" ON staff_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.role IN ('manager', 'admin')
    )
  );

-- Staff can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON staff_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Availability: Staff can view/manage their own, managers see all
CREATE POLICY "Staff view own availability" ON availability_cache
  FOR ALL USING (
    employee_id IN (
      SELECT airtable_employee_id FROM staff_profiles WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.role IN ('manager', 'admin')
    )
  );

-- Bookings: Staff see their assigned bookings, managers see all
CREATE POLICY "Staff view assigned bookings" ON booking_cache
  FOR SELECT USING (
    onboarding_employee_id IN (
      SELECT airtable_employee_id FROM staff_profiles WHERE user_id = auth.uid()
    ) OR
    deloading_employee_id IN (
      SELECT airtable_employee_id FROM staff_profiles WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.role IN ('manager', 'admin')
    )
  );

-- Checklist templates: All authenticated users can view
CREATE POLICY "All staff can view checklist templates" ON checklist_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Completed checklists: Staff can manage their own
CREATE POLICY "Staff manage own checklists" ON completed_checklists
  FOR ALL USING (
    employee_id IN (
      SELECT airtable_employee_id FROM staff_profiles WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.role IN ('manager', 'admin')
    )
  );

-- App settings: Only admins can modify, all can read
CREATE POLICY "All staff can read settings" ON app_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can modify settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.role = 'admin'
    )
  );

-- Functions

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_cache_updated_at BEFORE UPDATE ON availability_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_cache_updated_at BEFORE UPDATE ON booking_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completed_checklists_updated_at BEFORE UPDATE ON completed_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id UUID,
  airtable_employee_id TEXT,
  full_name TEXT,
  email TEXT,
  role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.airtable_employee_id,
    sp.full_name,
    sp.email,
    sp.role,
    sp.is_active
  FROM staff_profiles sp
  WHERE sp.user_id = auth.uid()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default app settings
INSERT INTO app_settings (key, value, description) VALUES
  ('sync_interval_minutes', '5', 'How often to sync with Airtable'),
  ('max_booking_days_ahead', '30', 'How many days ahead to show bookings'),
  ('default_availability_start_time', '"06:00"', 'Default start time for availability'),
  ('default_availability_end_time', '"18:00"', 'Default end time for availability')
ON CONFLICT (key) DO NOTHING; 