-- Fix corrigido para permitir insert no trigger handle_new_user
-- Execute isso no SQL Editor do Supabase Dashboard

-- Atualizar a função (removido EXECUTE para teste, mantendo SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
    
    INSERT INTO public.user_profiles (
        id,
        email,
        subscription_status,
        stripe_customer_id,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'pending_email',
        NULL,
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user % - %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar ou recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verificar se a função foi atualizada
SELECT 'Função atualizada com sucesso!' as status;