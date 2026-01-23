-- Fix the overly permissive INSERT policy on audit_logs
-- This should be restricted to authenticated users only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);