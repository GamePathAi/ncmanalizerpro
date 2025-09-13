import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDatabase() {
  try {
    // 1. Drop existing trigger and function if they exist
    const dropSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `;
    const { error: dropError } = await supabase.rpc('execute_sql', { query: dropSql });
    if (dropError) throw dropError;
    console.log('Existing trigger and function dropped.');

    // 2. Create or alter user_profiles table with correct columns
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text NOT NULL,
        password_hash text,
        email_verified_at timestamptz,
        subscription_status text NOT NULL DEFAULT 'pending_email',
        stripe_customer_id text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- Add missing columns if table exists
      ALTER TABLE public.user_profiles 
      ADD COLUMN IF NOT EXISTS password_hash text,
      ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
      ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'pending_email',
      ADD COLUMN IF NOT EXISTS stripe_customer_id text;

      -- Enable RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

      -- Policies
      CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Allow insert for new users" ON public.user_profiles FOR INSERT WITH CHECK (true);
    `;
    const { error: tableError } = await supabase.rpc('execute_sql', { query: createTableSql });
    if (tableError) throw tableError;
    console.log('Table user_profiles fixed.');

    // 3. Create new handle_new_user function
    const functionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.user_profiles (id, email, email_verified_at, subscription_status)
        VALUES (NEW.id, NEW.email, NEW.email_confirmed_at, 
          CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_subscription' ELSE 'pending_email' END
        )
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, email_verified_at = EXCLUDED.email_verified_at, subscription_status = EXCLUDED.subscription_status;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    const { error: funcError } = await supabase.rpc('execute_sql', { query: functionSql });
    if (funcError) throw funcError;
    console.log('New handle_new_user function created.');

    // 4. Create trigger
    const triggerSql = `
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    const { error: triggerError } = await supabase.rpc('execute_sql', { query: triggerSql });
    if (triggerError) throw triggerError;
    console.log('Trigger created.');

    console.log('Database fixed successfully!');
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

fixDatabase();