-- Add parent_comment_id column to comments table for threaded replies
ALTER TABLE comments 
ADD COLUMN parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE;

-- Add index for better performance when querying thread replies
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- Add index for better performance when querying comments by post
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);