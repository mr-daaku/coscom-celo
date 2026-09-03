-- Deny-all policies for backend-only tables (service_role bypasses RLS)
DROP POLICY IF EXISTS "No client access" ON public.api_rate_limits;
CREATE POLICY "No client access" ON public.api_rate_limits FOR SELECT TO authenticated USING (false);

DROP POLICY IF EXISTS "No client access" ON public.auth_tokens;
CREATE POLICY "No client access" ON public.auth_tokens FOR SELECT TO authenticated USING (false);

REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.monthly_volume_usd(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monthly_volume_usd(uuid) TO authenticated;