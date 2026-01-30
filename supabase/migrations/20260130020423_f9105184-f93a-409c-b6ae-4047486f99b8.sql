-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for study materials bucket
CREATE POLICY "Faculty can upload study materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-materials' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_type = 'faculty'
  )
);

CREATE POLICY "Anyone can view study materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials');

CREATE POLICY "Faculty can delete their own materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.user_type = 'faculty'
  )
);