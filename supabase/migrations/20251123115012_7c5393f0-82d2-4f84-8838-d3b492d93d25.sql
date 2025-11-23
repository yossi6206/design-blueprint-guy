-- Drop the old constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with all notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'like',
  'comment',
  'follow',
  'mention',
  'retweet',
  'boost',
  'new_post',
  'verification_approved',
  'verification_rejected'
]));