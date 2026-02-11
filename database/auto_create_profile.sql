-- Fragranza Olio - Auto Create Profile Trigger
-- This creates a profile automatically when a user signs up
-- Run this in Supabase SQL Editor

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create function to handle new user signup (with fixed search_path)
-- This reads ALL user metadata from the registration form
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
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
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
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
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role,
        NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'company_position', ''),
        NULLIF(NEW.raw_user_meta_data->>'department', ''),
        COALESCE((NEW.raw_user_meta_data->>'subscribe_newsletter')::boolean, FALSE),
        TRUE,
        FALSE
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Fix handle_updated_at function search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Fix RLS policies - make them more specific
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Allow authenticated users to insert ONLY their own profile (specific check)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

SELECT 'Security fixes applied successfully!' as result;
