-- Create invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create invitations table for secure user invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role public.user_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast token lookup
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_establishment ON public.invitations(establishment_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
USING (
  establishment_id = get_current_user_establishment() 
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

CREATE POLICY "View own invitations by token"
ON public.invitations
FOR SELECT
USING (true);

-- Function to generate secure invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
BEGIN
  LOOP
    new_token := encode(gen_random_bytes(32), 'hex');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM invitations WHERE token = new_token
    );
  END LOOP;
  RETURN new_token;
END;
$$;

-- Function to validate and get invitation by token
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_param TEXT)
RETURNS TABLE (
  invitation_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role public.user_role,
  establishment_id UUID,
  establishment_name TEXT,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.first_name,
    i.last_name,
    i.role,
    i.establishment_id,
    e.name,
    (i.status = 'pending' AND i.expires_at > now()) as is_valid,
    CASE 
      WHEN i.status = 'accepted' THEN 'Cette invitation a déjà été utilisée'
      WHEN i.status = 'expired' THEN 'Cette invitation a expiré'
      WHEN i.status = 'cancelled' THEN 'Cette invitation a été annulée'
      WHEN i.expires_at <= now() THEN 'Cette invitation a expiré'
      ELSE NULL
    END as error_message
  FROM invitations i
  JOIN establishments e ON e.id = i.establishment_id
  WHERE i.token = token_param;
END;
$$;

-- Function to mark invitation as accepted
CREATE OR REPLACE FUNCTION public.accept_invitation(token_param TEXT, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invitations 
  SET 
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  WHERE token = token_param 
    AND status = 'pending' 
    AND expires_at > now();
  
  RETURN FOUND;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Cron job function to expire old invitations (to be called periodically)
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE invitations 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at <= now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;