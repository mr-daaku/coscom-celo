REVOKE ALL ON FUNCTION public.settle_payment(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_payment(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.monthly_volume_usd(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_payment(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_payment(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.monthly_volume_usd(uuid) TO service_role;