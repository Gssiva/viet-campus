-- Create timetables table for AI-generated schedules
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  section VARCHAR(10),
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  generated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timetable_slots for individual periods
CREATE TABLE public.timetable_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  faculty_id UUID REFERENCES public.profiles(id),
  room_number VARCHAR(20),
  slot_type VARCHAR(20) NOT NULL DEFAULT 'lecture', -- lecture, lab, break, lunch
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- attendance, assignment, fee, announcement
  reference_id UUID, -- ID of related record
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_notifications_log for tracking daily sends
CREATE TABLE public.attendance_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  parent_id UUID REFERENCES public.profiles(id),
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  notification_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

-- Enable RLS
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_notification_logs ENABLE ROW LEVEL SECURITY;

-- Timetable policies - viewable by all authenticated users
CREATE POLICY "Timetables are viewable by authenticated users"
ON public.timetables FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Faculty can manage timetables"
ON public.timetables FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_type = 'faculty'
  )
);

-- Timetable slots policies
CREATE POLICY "Timetable slots are viewable by authenticated users"
ON public.timetable_slots FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Faculty can manage timetable slots"
ON public.timetable_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_type = 'faculty'
  )
);

-- Notification policies - users can only see their own
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Faculty can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_type = 'faculty'
  )
);

-- Attendance notification log policies
CREATE POLICY "Faculty can manage attendance notification logs"
ON public.attendance_notification_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_type = 'faculty'
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_timetables_updated_at
BEFORE UPDATE ON public.timetables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_timetables_course ON public.timetables(course_id);
CREATE INDEX idx_timetable_slots_timetable ON public.timetable_slots(timetable_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;