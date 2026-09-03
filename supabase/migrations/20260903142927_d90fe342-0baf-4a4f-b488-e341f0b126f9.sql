-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','merchant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- grant admin to the designated owner email (now and on future signup)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'mr.daaku.gd@gmail.com'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'mr.daaku.gd@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- Merchant accounts / settings + plan
CREATE TABLE IF NOT EXISTS public.merchant_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  support_email text,
  payout_address text,
  payout_chain text,
  webhook_url text,
  webhook_secret text NOT NULL DEFAULT encode(gen_random_bytes(24),'hex'),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','cos','core')),
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active','pending','expired')),
  plan_expires_at timestamptz,
  suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.merchant_accounts TO authenticated;
GRANT ALL ON public.merchant_accounts TO service_role;
ALTER TABLE public.merchant_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own account read" ON public.merchant_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own account insert" ON public.merchant_accounts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own account update" ON public.merchant_accounts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Payments (gateway charges)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  amount_usd numeric(18,2) NOT NULL CHECK (amount_usd > 0),
  coin text NOT NULL,
  chain text NOT NULL,
  crypto_amount numeric(38,10),
  deposit_address text NOT NULL,
  fee_percent numeric(6,3) NOT NULL,
  fee_usd numeric(18,2) NOT NULL DEFAULT 0,
  net_usd numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirming','paid','expired','failed')),
  tx_hash text,
  confirmations integer NOT NULL DEFAULT 0,
  customer_email text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id, created_at DESC);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own payments read" ON public.payments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin text NOT NULL,
  chain text NOT NULL,
  to_address text NOT NULL,
  amount_usd numeric(18,2) NOT NULL CHECK (amount_usd > 0),
  fee_percent numeric(6,3) NOT NULL,
  fee_usd numeric(18,2) NOT NULL DEFAULT 0,
  net_usd numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','rejected')),
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own withdrawals read" ON public.withdrawals
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Plan purchases paid in crypto
CREATE TABLE IF NOT EXISTS public.plan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('cos','core')),
  price_usd numeric(18,2) NOT NULL,
  coin text NOT NULL,
  chain text NOT NULL,
  deposit_address text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '60 minutes',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.plan_payments TO authenticated;
GRANT ALL ON public.plan_payments TO service_role;
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own plan payments read" ON public.plan_payments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- API rate limiting (backend only)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  UNIQUE (bucket, window_start)
);
GRANT ALL ON public.api_rate_limits TO service_role;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Monthly settled volume helper for plan limits
CREATE OR REPLACE FUNCTION public.monthly_volume_usd(_user_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(amount_usd),0) FROM public.payments
  WHERE user_id = _user_id AND status = 'paid' AND created_at >= date_trunc('month', now())
$$;
GRANT EXECUTE ON FUNCTION public.monthly_volume_usd(uuid) TO authenticated;