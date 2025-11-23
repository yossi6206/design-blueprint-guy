-- Create notification function for new posts to followers
CREATE OR REPLACE FUNCTION notify_followers_on_new_post()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
BEGIN
  -- Create notification for each follower when user posts
  FOR follower_record IN
    SELECT follower_id
    FROM follows
    WHERE following_id = NEW.user_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      actor_name,
      actor_handle,
      post_id,
      content
    ) VALUES (
      follower_record.follower_id,
      'new_post',
      NEW.user_id,
      NEW.author_name,
      NEW.author_handle,
      NEW.id,
      LEFT(NEW.content, 100)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger for new posts (only for original posts, not retweets)
DROP TRIGGER IF EXISTS notify_followers_on_post ON posts;
CREATE TRIGGER notify_followers_on_post
  AFTER INSERT ON posts
  FOR EACH ROW
  WHEN (NEW.is_retweet IS NULL OR NEW.is_retweet = false)
  EXECUTE FUNCTION notify_followers_on_new_post();