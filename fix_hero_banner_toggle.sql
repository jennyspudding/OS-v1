-- Fix Hero Banner Toggle Issue
-- Run this in your Supabase SQL Editor

-- 1. Create the hero_banner_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS hero_banner_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Insert or update the setting to false (since admin shows it's toggled off)
INSERT INTO hero_banner_settings (is_visible)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM hero_banner_settings)
ON CONFLICT (id) DO NOTHING;

-- If record exists, update it to false
UPDATE hero_banner_settings 
SET is_visible = false, updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM hero_banner_settings);

-- 3. Enable RLS but allow public read access for the frontend
ALTER TABLE hero_banner_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to read hero banner settings" ON hero_banner_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read hero banner settings" ON hero_banner_settings;
DROP POLICY IF EXISTS "Allow admin users to update hero banner settings" ON hero_banner_settings;

-- Create new policies - allow public read for frontend access
CREATE POLICY "Allow public to read hero banner settings" ON hero_banner_settings
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to update settings (admin)
CREATE POLICY "Allow authenticated users to update hero banner settings" ON hero_banner_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Verify the settings
SELECT 
    'Hero banner settings:' as info,
    is_visible,
    updated_at
FROM hero_banner_settings;

-- 5. Alternative: Create a function that the frontend can call directly
CREATE OR REPLACE FUNCTION get_hero_banner_visibility()
RETURNS BOOLEAN AS $$
DECLARE
    visibility BOOLEAN;
BEGIN
    SELECT is_visible INTO visibility
    FROM hero_banner_settings
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Return false if no setting found or if explicitly set to false
    RETURN COALESCE(visibility, false);
END;
$$ LANGUAGE plpgsql;

-- Allow public access to this function
GRANT EXECUTE ON FUNCTION get_hero_banner_visibility() TO public;

-- Test the function
SELECT get_hero_banner_visibility() as hero_banner_visible; 