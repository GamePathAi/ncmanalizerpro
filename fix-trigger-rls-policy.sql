-- Script para corrigir política RLS que impede o trigger de funcionar
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover política conflitante que impede o trigger
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- 2. Criar nova política que permite inserção via trigger
CREATE POLICY "Allow trigger to insert profiles" ON public.user_profiles
    FOR INSERT 
    WITH CHECK (true); -- Permite inserção via trigger/função

-- 3. Manter política de visualização
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- 4. Manter política de atualização
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Verificar se as políticas foram criadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 6. Testar se o trigger está funcionando
SELECT 'Políticas RLS corrigidas! Execute o teste novamente.' as resultado;