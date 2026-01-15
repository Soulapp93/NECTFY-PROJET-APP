-- Create user_signatures table to store saved signatures
CREATE TABLE public.user_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  signature_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;

-- Create policies for user signatures
CREATE POLICY "Users can view their own signatures" 
ON public.user_signatures 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own signatures" 
ON public.user_signatures 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own signatures" 
ON public.user_signatures 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own signatures" 
ON public.user_signatures 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_signatures_updated_at
BEFORE UPDATE ON public.user_signatures
FOR EACH ROW
EXECUTE FUNCTION public.update_user_signatures_updated_at();

-- Add unique constraint to ensure one signature per user
ALTER TABLE public.user_signatures 
ADD CONSTRAINT unique_user_signature UNIQUE (user_id);