-- Create custom types for roles
CREATE TYPE public.faculty_role AS ENUM ('administration', 'accounts', 'hod', 'teaching', 'non_teaching');
CREATE TYPE public.user_type AS ENUM ('student', 'faculty', 'parent');

-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  duration_years INTEGER NOT NULL DEFAULT 4,
  total_semesters INTEGER NOT NULL DEFAULT 8,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table for all users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_type public.user_type NOT NULL,
  employee_id TEXT UNIQUE,
  roll_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  department_id UUID REFERENCES public.departments(id),
  course_id UUID REFERENCES public.courses(id),
  current_semester INTEGER,
  section TEXT,
  batch_year INTEGER,
  linked_student_id UUID REFERENCES public.profiles(id),
  is_first_login BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_employee_id CHECK (
    (user_type = 'faculty' AND employee_id IS NOT NULL) OR 
    (user_type != 'faculty')
  ),
  CONSTRAINT valid_roll_number CHECK (
    (user_type = 'student' AND roll_number IS NOT NULL) OR 
    (user_type != 'student')
  ),
  CONSTRAINT valid_parent_link CHECK (
    (user_type = 'parent' AND linked_student_id IS NOT NULL) OR 
    (user_type != 'parent')
  )
);

-- Faculty roles table (separate from profiles for security)
CREATE TABLE public.faculty_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.faculty_role NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  semester INTEGER NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  is_lab BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Faculty subject assignments
CREATE TABLE public.faculty_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  section TEXT,
  academic_year TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (faculty_id, subject_id, section, academic_year)
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  faculty_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, date)
);

-- Fee structure table
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'exam', 'transport', 'hostel', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (course_id, academic_year, fee_type)
);

-- Student fee payments
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE CASCADE NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'other')),
  transaction_id TEXT,
  receipt_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  faculty_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('assignment', 'test', 'record', 'project')),
  max_marks INTEGER NOT NULL DEFAULT 100,
  due_date TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  model_answer_url TEXT,
  is_ai_evaluation_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student submissions
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  submitted_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'evaluated', 'returned')),
  UNIQUE (assignment_id, student_id)
);

-- Evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  faculty_id UUID REFERENCES public.profiles(id),
  marks_obtained DECIMAL(5, 2),
  ai_suggested_marks DECIMAL(5, 2),
  ai_similarity_score DECIMAL(5, 2),
  feedback TEXT,
  ai_feedback TEXT,
  is_ai_evaluated BOOLEAN NOT NULL DEFAULT false,
  is_faculty_approved BOOLEAN NOT NULL DEFAULT false,
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam results table
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('internal1', 'internal2', 'internal3', 'external', 'supplementary')),
  academic_year TEXT NOT NULL,
  max_marks INTEGER NOT NULL,
  marks_obtained DECIMAL(5, 2),
  grade TEXT,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, exam_type, academic_year)
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'faculty', 'students', 'parents', 'department')),
  target_department_id UUID REFERENCES public.departments(id),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study materials table
CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  faculty_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transport routes table
CREATE TABLE public.transport_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_name TEXT NOT NULL,
  route_number TEXT NOT NULL UNIQUE,
  stops JSONB NOT NULL DEFAULT '[]',
  fee_per_semester DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student transport enrollment
CREATE TABLE public.transport_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE NOT NULL,
  stop_name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_enrollments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check faculty role
CREATE OR REPLACE FUNCTION public.has_faculty_role(_user_id uuid, _role public.faculty_role)
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

-- Function to check if user is admin or HOD
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

-- Function to get user type
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS public.user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- RLS Policies

-- Departments: Public read, admin write
CREATE POLICY "Departments are viewable by everyone" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.has_faculty_role(auth.uid(), 'administration'));

-- Courses: Public read, admin write
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.has_faculty_role(auth.uid(), 'administration'));

-- Profiles: Users can view relevant profiles, own profile editable
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Faculty can view all profiles" ON public.profiles FOR SELECT USING (
  public.get_user_type(auth.uid()) = 'faculty'
);
CREATE POLICY "Parents can view linked student profile" ON public.profiles FOR SELECT USING (
  id = (SELECT linked_student_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Students can view classmates" ON public.profiles FOR SELECT USING (
  user_type = 'student' AND 
  course_id = (SELECT course_id FROM public.profiles WHERE user_id = auth.uid()) AND
  current_semester = (SELECT current_semester FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.has_faculty_role(auth.uid(), 'administration'));

-- Faculty roles: Admins can manage, users can view own
CREATE POLICY "Users can view their own roles" ON public.faculty_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage faculty roles" ON public.faculty_roles FOR ALL USING (public.has_faculty_role(auth.uid(), 'administration'));

-- Subjects: Public read
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins and HODs can manage subjects" ON public.subjects FOR ALL USING (public.is_admin_or_hod(auth.uid()));

-- Faculty subjects: Faculty can view own, HOD/Admin can manage
CREATE POLICY "Faculty can view their subject assignments" ON public.faculty_subjects FOR SELECT USING (
  faculty_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "HODs and Admins can manage faculty subjects" ON public.faculty_subjects FOR ALL USING (public.is_admin_or_hod(auth.uid()));

-- Attendance: Students see own, faculty see their classes
CREATE POLICY "Students can view their own attendance" ON public.attendance FOR SELECT USING (
  student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Parents can view linked student attendance" ON public.attendance FOR SELECT USING (
  student_id = (SELECT linked_student_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Faculty can view and manage attendance for their subjects" ON public.attendance FOR ALL USING (
  faculty_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "HODs can view department attendance" ON public.attendance FOR SELECT USING (public.has_faculty_role(auth.uid(), 'hod'));

-- Fee structures: Public read, accounts can manage
CREATE POLICY "Fee structures are viewable by authenticated users" ON public.fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Accounts can manage fee structures" ON public.fee_structures FOR ALL USING (public.has_faculty_role(auth.uid(), 'accounts'));

-- Fee payments: Students see own, accounts can manage
CREATE POLICY "Students can view their own payments" ON public.fee_payments FOR SELECT USING (
  student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Parents can view linked student payments" ON public.fee_payments FOR SELECT USING (
  student_id = (SELECT linked_student_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Accounts can manage all payments" ON public.fee_payments FOR ALL USING (public.has_faculty_role(auth.uid(), 'accounts'));

-- Assignments: Students see relevant, faculty manage own
CREATE POLICY "Students can view assignments for their subjects" ON public.assignments FOR SELECT USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.profiles p ON p.course_id = s.course_id AND p.current_semester = s.semester
    WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Faculty can manage their assignments" ON public.assignments FOR ALL USING (
  faculty_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Submissions: Students manage own, faculty view for their assignments
CREATE POLICY "Students can manage their own submissions" ON public.submissions FOR ALL USING (
  student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Faculty can view submissions for their assignments" ON public.submissions FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE faculty_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Evaluations: Students see own, faculty manage for their submissions
CREATE POLICY "Students can view their own evaluations" ON public.evaluations FOR SELECT USING (
  submission_id IN (
    SELECT id FROM public.submissions WHERE student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Parents can view linked student evaluations" ON public.evaluations FOR SELECT USING (
  submission_id IN (
    SELECT s.id FROM public.submissions s
    JOIN public.profiles p ON s.student_id = p.id
    WHERE p.id = (SELECT linked_student_id FROM public.profiles WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Faculty can manage evaluations for their submissions" ON public.evaluations FOR ALL USING (
  faculty_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Exam results: Students see own, faculty/admin can manage
CREATE POLICY "Students can view their own results" ON public.exam_results FOR SELECT USING (
  student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Parents can view linked student results" ON public.exam_results FOR SELECT USING (
  student_id = (SELECT linked_student_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Faculty can view and manage results" ON public.exam_results FOR ALL USING (
  public.get_user_type(auth.uid()) = 'faculty'
);

-- Announcements: Based on target audience
CREATE POLICY "Users can view relevant announcements" ON public.announcements FOR SELECT USING (
  is_active = true AND
  (expires_at IS NULL OR expires_at > now()) AND
  (
    target_audience = 'all' OR
    (target_audience = 'faculty' AND public.get_user_type(auth.uid()) = 'faculty') OR
    (target_audience = 'students' AND public.get_user_type(auth.uid()) = 'student') OR
    (target_audience = 'parents' AND public.get_user_type(auth.uid()) = 'parent') OR
    (target_audience = 'department' AND target_department_id = (SELECT department_id FROM public.profiles WHERE user_id = auth.uid()))
  )
);
CREATE POLICY "Admins and HODs can manage announcements" ON public.announcements FOR ALL USING (public.is_admin_or_hod(auth.uid()));

-- Study materials: Students see for their subjects, faculty manage own
CREATE POLICY "Students can view study materials" ON public.study_materials FOR SELECT USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.profiles p ON p.course_id = s.course_id AND p.current_semester = s.semester
    WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Faculty can manage their study materials" ON public.study_materials FOR ALL USING (
  faculty_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Audit logs: Only admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_faculty_role(auth.uid(), 'administration'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Transport routes: Public read
CREATE POLICY "Transport routes are viewable by everyone" ON public.transport_routes FOR SELECT USING (true);
CREATE POLICY "Admins can manage transport routes" ON public.transport_routes FOR ALL USING (public.has_faculty_role(auth.uid(), 'administration'));

-- Transport enrollments: Students see own, accounts can manage
CREATE POLICY "Students can view their own transport enrollment" ON public.transport_enrollments FOR SELECT USING (
  student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Parents can view linked student transport" ON public.transport_enrollments FOR SELECT USING (
  student_id = (SELECT linked_student_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Accounts and Admins can manage transport enrollments" ON public.transport_enrollments FOR ALL USING (
  public.has_faculty_role(auth.uid(), 'accounts') OR public.has_faculty_role(auth.uid(), 'administration')
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();