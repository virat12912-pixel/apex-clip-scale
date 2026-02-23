
-- Client balances table
CREATE TABLE public.client_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  available_balance numeric NOT NULL DEFAULT 0,
  total_funded numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  pending_spend numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Balance transactions history
CREATE TABLE public.balance_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'campaign_spend', 'topup_request')),
  amount numeric NOT NULL,
  description text,
  notes text,
  related_campaign_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for client_balances
CREATE POLICY "Users can view own balance" ON public.client_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all balances" ON public.client_balances FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage balances" ON public.client_balances FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for balance_transactions
CREATE POLICY "Users can view own transactions" ON public.balance_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all transactions" ON public.balance_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage transactions" ON public.balance_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert topup requests" ON public.balance_transactions FOR INSERT WITH CHECK (user_id = auth.uid() AND type = 'topup_request');

-- Auto-create client balance for brand users (trigger on role assignment)
-- We'll also allow manual creation
CREATE POLICY "Users can insert own balance" ON public.client_balances FOR INSERT WITH CHECK (user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_client_balances_updated_at
  BEFORE UPDATE ON public.client_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
