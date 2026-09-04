CREATE OR REPLACE FUNCTION public.settle_payment(
  p_payment_id uuid,
  p_tx_hash text,
  p_confirmations integer DEFAULT 1
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
BEGIN
  -- Lock the row so concurrent submissions cannot credit the balance twice.
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.status = 'paid' THEN
    RETURN v_payment;
  END IF;

  UPDATE public.payments
     SET status = 'paid',
         tx_hash = p_tx_hash,
         confirmations = p_confirmations,
         paid_at = now()
   WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  INSERT INTO public.transactions (
    user_id, chain, coin, amount, usd_value, direction,
    to_address, tx_hash, status, confirmed_at
  ) VALUES (
    v_payment.user_id, v_payment.chain, v_payment.coin,
    COALESCE(v_payment.crypto_amount, 0)::text, v_payment.amount_usd, 'in',
    v_payment.deposit_address, p_tx_hash, 'confirmed', now()
  );

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_payment(uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_payment(uuid, text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_payment(p_payment_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.payments
   WHERE id = p_payment_id
     AND user_id = p_user_id
     AND status <> 'paid';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_payment(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_payment(uuid, uuid) TO service_role;