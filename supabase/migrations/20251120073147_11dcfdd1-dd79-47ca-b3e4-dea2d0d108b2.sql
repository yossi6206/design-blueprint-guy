-- Create suggestion_interactions table to track user behavior
CREATE TABLE public.suggestion_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('followed', 'dismissed', 'viewed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, suggested_user_id, interaction_type)
);

-- Enable RLS
ALTER TABLE public.suggestion_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own interactions"
  ON public.suggestion_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
  ON public.suggestion_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_suggestion_interactions_user_id ON public.suggestion_interactions(user_id);
CREATE INDEX idx_suggestion_interactions_suggested_user_id ON public.suggestion_interactions(suggested_user_id);
CREATE INDEX idx_suggestion_interactions_type ON public.suggestion_interactions(interaction_type);
CREATE INDEX idx_suggestion_interactions_created_at ON public.suggestion_interactions(created_at DESC);