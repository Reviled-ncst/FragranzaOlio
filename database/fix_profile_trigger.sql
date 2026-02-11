-- Fragranza Olio - Fix Profile Trigger (v2)
-- Run this in Supabase SQL Editor to fix profile creation

-- =====================================================
-- STEP 1: Drop and recreate the trigger
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = ''
AS $$
DECLARE
    user_role public.user_role;
BEGIN
    -- Get role from metadata, default to 'customer'
    user_role := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role, 
        'customer'::public.user_role
    );
    
    -- Log what we're doing (check Supabase logs)
    RAISE NOTICE 'Creating profile for user % with role %', NEW.email, user_role;
    RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;

    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        email,
        birth_date,
        gender,
        phone,
        address,
        city,
        province,
        zip_code,
        role,
        company_name,
        company_position,
        department,
        subscribe_newsletter,
        is_active,
        is_verified
    )
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'User'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), ''),
        NEW.email,
        CASE 
            WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL 
                 AND NEW.raw_user_meta_data->>'birth_date' != '' 
            THEN (NEW.raw_user_meta_data->>'birth_date')::date 
            ELSE NULL 
        END,
        NULLIF(NEW.raw_user_meta_data->>'gender', ''),
        NULLIF(NEW.raw_user_meta_data->>'phone', ''),
        NULLIF(NEW.raw_user_meta_data->>'address', ''),
        NULLIF(NEW.raw_user_meta_data->>'city', ''),
        NULLIF(NEW.raw_user_meta_data->>'province', ''),
        NULLIF(NEW.raw_user_meta_data->>'zip_code', ''),
        user_role,
        NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'company_position', ''),
        NULLIF(NEW.raw_user_meta_data->>'department', ''),
        COALESCE((NEW.raw_user_meta_data->>'subscribe_newsletter')::boolean, FALSE),
        TRUE,
        FALSE
    );
    
    RAISE NOTICE 'Profile created successfully for %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 2: Fix existing vendor0qw@gmail.com profile
-- =====================================================

UPDATE public.profiles 
SET 
    role = 'sales',
    first_name = 'Sales',
    last_name = 'Representative',
    company_name = 'Fragranza Olio',
    company_position = 'Sales Representative',
    department = 'Sales',
    updated_at = NOW()
WHERE email = 'vendor0qw@gmail.com';

-- =====================================================
-- STEP 3: Sync profiles for users that might be missing profiles
-- =====================================================

-- Insert profiles for any auth users that don't have one
INSERT INTO public.profiles (id, first_name, last_name, email, role, is_active, is_verified)
SELECT 
    u.id,
    COALESCE(NULLIF(u.raw_user_meta_data->>'first_name', ''), 'User'),
    COALESCE(NULLIF(u.raw_user_meta_data->>'last_name', ''), ''),
    u.email,
    COALESCE(NULLIF(u.raw_user_meta_data->>'role', '')::public.user_role, 'customer'::public.user_role),
    TRUE,
    FALSE
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- =====================================================
-- STEP 4: Grant permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Allow service role full access (needed for trigger)
ALTER TABLE public.profiles OWNER TO postgres;

SELECT 
    'Fixed! Profile trigger updated and vendor0qw@gmail.com role set to: ' || role as result 
FROM public.profiles 
WHERE email = 'vendor0qw@gmail.com';
