-- Add campaign_id to payouts so payout requests are per-campaign
ALTER TABLE public.payouts ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id);

-- Create index for faster lookups
CREATE INDEX idx_payouts_campaign_id ON public.payouts(campaign_id);
