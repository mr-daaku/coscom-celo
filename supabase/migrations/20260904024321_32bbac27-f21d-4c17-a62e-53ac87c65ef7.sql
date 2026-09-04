CREATE TABLE public.plan_settings (
  plan text PRIMARY KEY,
  price_usd numeric NOT NULL DEFAULT 0,
  fee_percent numeric NOT NULL DEFAULT 3,
  withdraw_fee_percent numeric NOT NULL DEFAULT 2,
  monthly_volume_usd numeric NOT NULL DEFAULT 5000,
  max_payment_usd numeric NOT NULL DEFAULT 1000,
  api_keys integer NOT NULL DEFAULT 1,
  min_withdraw_usd numeric NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plan_settings TO anon;
GRANT SELECT ON public.plan_settings TO authenticated;
GRANT ALL ON public.plan_settings TO service_role;

ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plan settings are publicly readable"
  ON public.plan_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update plan settings"
  ON public.plan_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_plan_settings_updated_at
  BEFORE UPDATE ON public.plan_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plan_settings (plan, price_usd, fee_percent, withdraw_fee_percent, monthly_volume_usd, max_payment_usd, api_keys, min_withdraw_usd) VALUES
  ('free', 0, 3, 2, 5000, 1000, 1, 25),
  ('cos', 30, 1.5, 1, 250000, 25000, 5, 10),
  ('core', 75, 0.5, 0.5, 2000000, 250000, 25, 5);