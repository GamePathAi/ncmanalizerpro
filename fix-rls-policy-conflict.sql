-- Fix RLS Policy Conflict for password_reset_tokens table
-- This script resolves the duplicate policy error by dropping and recreating policies

-- First, ensure RLS is enabled on the table
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - select" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - insert" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - update" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage password reset tokens - delete" ON public.password_reset_tokens;

-- Create separate policies for each operation (best practice)
-- SELECT policy
CREATE POLICY "Service role can manage password reset tokens - select" 
ON public.password_reset_tokens 
FOR SELECT 
TO service_role 
USING (true);

-- INSERT policy
CREATE POLICY "Service role can manage password reset tokens - insert" 
ON public.password_reset_tokens 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- UPDATE policy
CREATE POLICY "Service role can manage password reset tokens - update" 
ON public.password_reset_tokens 
FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

-- DELETE policy
CREATE POLICY "Service role can manage password reset tokens - delete" 
ON public.password_reset_tokens 
FOR DELETE 
TO service_role 
USING (true);

-- Also create policies for authenticated users to manage their own tokens
-- Users can only see their own tokens
CREATE POLICY "Users can view own password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Users can insert their own tokens (for password reset requests)
CREATE POLICY "Users can create own password reset tokens" 
ON public.password_reset_tokens 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Users can update their own tokens (for token usage/expiration)
CREATE POLICY "Users can update own password reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Users can delete their own tokens
CREATE POLICY "Users can delete own password reset tokens" 
ON public.password_reset_tokens 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Verify policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'password_reset_tokens'
ORDER BY policyname;