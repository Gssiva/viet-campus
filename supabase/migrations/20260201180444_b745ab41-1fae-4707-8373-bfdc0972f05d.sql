-- Fix infinite recursion in RLS policies by making helper functions SECURITY DEFINER
-- This allows them to bypass RLS when checking user permissions

-- Drop and recreate get_user_type with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- Recreate has_faculty_role with proper SECURITY DEFINER (already might have it, but ensure)
CREATE OR REPLACE FUNCTION public.has_faculty_role(_user_id uuid, _role faculty_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.faculty_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Also create is_admin_or_hod with SECURITY DEFINER if it exists
CREATE OR REPLACE FUNCTION public.is_admin_or_hod(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.faculty_roles
    WHERE user_id = _user_id
      AND role IN ('administration', 'hod')
  )
$$;