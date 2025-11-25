-- Add RLS policies for mentions
CREATE POLICY "Users can create mentions"
ON public.mentions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add RLS policies for notifications  
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add RLS policies for hashtags
CREATE POLICY "Anyone can create hashtags"
ON public.hashtags
FOR INSERT
WITH CHECK (true);

-- Add RLS policies for post_hashtags
CREATE POLICY "Anyone can create post_hashtags"
ON public.post_hashtags
FOR INSERT
WITH CHECK (true);