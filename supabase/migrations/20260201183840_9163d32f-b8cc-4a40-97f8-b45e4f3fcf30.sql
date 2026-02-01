-- Create additional helper functions to avoid recursion in policies

-- Get profile ID from auth user ID
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id
$$;

-- Get course ID for a user
CREATE OR REPLACE FUNCTION public.get_user_course_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT course_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Get current semester for a user
CREATE OR REPLACE FUNCTION public.get_user_current_semester(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_semester FROM public.profiles WHERE user_id = _user_id
$$;

-- Get linked student ID for a parent
CREATE OR REPLACE FUNCTION public.get_linked_student_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT linked_student_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Drop and recreate the problematic policies on profiles table
DROP POLICY IF EXISTS "Students can view classmates" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view linked student profile" ON public.profiles;

-- Recreate policies using helper functions instead of subqueries
CREATE POLICY "Students can view classmates" ON public.profiles
FOR SELECT
USING (
  user_type = 'student'::user_type 
  AND course_id = public.get_user_course_id(auth.uid())
  AND current_semester = public.get_user_current_semester(auth.uid())
);

CREATE POLICY "Parents can view linked student profile" ON public.profiles
FOR SELECT
USING (id = public.get_linked_student_id(auth.uid()));