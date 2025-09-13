-- Update handle_new_user with search_path
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  status_text subscription_status_enum;
BEGIN
  status_text := (CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_subscription' ELSE 'pending_email' END)::subscription_status_enum;
  RAISE NOTICE 'Setting subscription_status to % for user %', status_text, NEW.id;

  INSERT INTO public.user_profiles (id, email, email_verified_at, subscription_status)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at, status_text)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, email_verified_at = EXCLUDED.email_verified_at, subscription_status = EXCLUDED.subscription_status;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();