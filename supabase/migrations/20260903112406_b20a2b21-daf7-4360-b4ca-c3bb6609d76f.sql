CREATE TABLE public.auth_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('verify','reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.auth_tokens TO service_role;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX auth_tokens_lookup ON public.auth_tokens (token_hash);