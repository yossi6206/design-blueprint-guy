-- Create experiments table for A/B testing
CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create experiment variants table
CREATE TABLE public.experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  algorithm_config JSONB NOT NULL,
  traffic_allocation DECIMAL(5,2) NOT NULL CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
  is_control BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user assignments table
CREATE TABLE public.experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, experiment_id)
);

-- Create experiment metrics table
CREATE TABLE public.experiment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('suggestion_shown', 'suggestion_followed', 'suggestion_dismissed', 'suggestion_clicked')),
  suggested_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiments (admin only - for now allow read for all authenticated)
CREATE POLICY "Anyone can view active experiments"
  ON public.experiments
  FOR SELECT
  USING (status = 'active');

-- RLS Policies for variants
CREATE POLICY "Anyone can view variants of active experiments"
  ON public.experiment_variants
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM experiments 
    WHERE id = experiment_variants.experiment_id 
    AND status = 'active'
  ));

-- RLS Policies for assignments
CREATE POLICY "Users can view their own assignments"
  ON public.experiment_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create assignments"
  ON public.experiment_assignments
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for metrics
CREATE POLICY "System can create metrics"
  ON public.experiment_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view aggregated metrics"
  ON public.experiment_metrics
  FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX idx_experiments_status ON public.experiments(status);
CREATE INDEX idx_experiment_variants_experiment_id ON public.experiment_variants(experiment_id);
CREATE INDEX idx_experiment_assignments_user_id ON public.experiment_assignments(user_id);
CREATE INDEX idx_experiment_assignments_experiment_id ON public.experiment_assignments(experiment_id);
CREATE INDEX idx_experiment_metrics_experiment_id ON public.experiment_metrics(experiment_id);
CREATE INDEX idx_experiment_metrics_variant_id ON public.experiment_metrics(variant_id);
CREATE INDEX idx_experiment_metrics_metric_type ON public.experiment_metrics(metric_type);
CREATE INDEX idx_experiment_metrics_created_at ON public.experiment_metrics(created_at DESC);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_experiments_updated_at_trigger
  BEFORE UPDATE ON experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_experiments_updated_at();

-- Insert default experiment for recommendations algorithm testing
INSERT INTO experiments (name, description, status, start_date)
VALUES (
  'Recommendations Algorithm V1 vs V2',
  'Testing enhanced ML algorithm against baseline',
  'active',
  now()
);

-- Get the experiment ID
DO $$
DECLARE
  exp_id UUID;
BEGIN
  SELECT id INTO exp_id FROM experiments WHERE name = 'Recommendations Algorithm V1 vs V2';
  
  -- Insert control variant (baseline algorithm)
  INSERT INTO experiment_variants (experiment_id, name, description, algorithm_config, traffic_allocation, is_control)
  VALUES (
    exp_id,
    'Control - Baseline',
    'Original recommendation algorithm without ML enhancements',
    '{"use_ml_boost": false, "max_score_multiplier": 1.0}',
    50.0,
    true
  );
  
  -- Insert test variant (ML-enhanced algorithm)
  INSERT INTO experiment_variants (experiment_id, name, description, algorithm_config, traffic_allocation, is_control)
  VALUES (
    exp_id,
    'Variant A - ML Enhanced',
    'Enhanced recommendation algorithm with machine learning boost',
    '{"use_ml_boost": true, "max_score_multiplier": 1.5}',
    50.0,
    false
  );
END $$;