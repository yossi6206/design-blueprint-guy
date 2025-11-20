-- Function to extract and create hashtags from post content
CREATE OR REPLACE FUNCTION extract_and_create_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_text text;
  hashtag_id uuid;
  hashtag_pattern text := '#[א-ת\w]+';
BEGIN
  -- Extract all hashtags from content
  FOR hashtag_text IN
    SELECT DISTINCT lower(substring(match[1] from 2)) -- Remove # and lowercase
    FROM regexp_matches(NEW.content, hashtag_pattern, 'g') AS match
  LOOP
    -- Insert hashtag if it doesn't exist
    INSERT INTO hashtags (tag)
    VALUES (hashtag_text)
    ON CONFLICT (tag) DO NOTHING;
    
    -- Get hashtag id
    SELECT id INTO hashtag_id FROM hashtags WHERE tag = hashtag_text;
    
    -- Link post to hashtag
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, hashtag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on posts table
DROP TRIGGER IF EXISTS trigger_extract_hashtags ON posts;
CREATE TRIGGER trigger_extract_hashtags
  AFTER INSERT OR UPDATE OF content ON posts
  FOR EACH ROW
  EXECUTE FUNCTION extract_and_create_hashtags();

-- Add unique constraint to hashtags tag column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'hashtags_tag_unique'
  ) THEN
    ALTER TABLE hashtags ADD CONSTRAINT hashtags_tag_unique UNIQUE (tag);
  END IF;
END $$;