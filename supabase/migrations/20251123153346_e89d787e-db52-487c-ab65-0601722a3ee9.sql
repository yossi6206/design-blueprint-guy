-- נקה טריגרים כפולים להתראות

-- מחק טריגרים ישנים תחילה
DROP TRIGGER IF EXISTS on_like_created ON likes;
DROP TRIGGER IF EXISTS on_follow_created ON follows;
DROP TRIGGER IF EXISTS on_comment_created ON comments;
DROP TRIGGER IF EXISTS on_comment_notify ON comments;
DROP TRIGGER IF EXISTS on_retweet_created ON retweets;
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;
DROP TRIGGER IF EXISTS on_mention_created ON mentions;
DROP TRIGGER IF EXISTS on_like_notify ON likes;
DROP TRIGGER IF EXISTS on_follow_notify ON follows;

-- עכשיו מחק פונקציות ישנות
DROP FUNCTION IF EXISTS create_like_notification();
DROP FUNCTION IF EXISTS create_follow_notification();
DROP FUNCTION IF EXISTS create_comment_notification();
DROP FUNCTION IF EXISTS create_retweet_notification();
DROP FUNCTION IF EXISTS notify_on_comment();
DROP FUNCTION IF EXISTS notify_on_like();
DROP FUNCTION IF EXISTS notify_on_follow();
DROP FUNCTION IF EXISTS notify_on_mention();
DROP FUNCTION IF EXISTS notify_on_retweet();

-- צור פונקציה אחת לכל סוג התראה

-- התראה על לייק
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  liker_name TEXT;
  liker_handle TEXT;
BEGIN
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT user_name, user_handle INTO liker_name, liker_handle
  FROM profiles WHERE id = NEW.user_id;
  
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id)
  VALUES (post_author_id, 'like', NEW.user_id, liker_name, liker_handle, NEW.post_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_like_notification();

-- התראה על follow
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
  follower_handle TEXT;
BEGIN
  SELECT user_name, user_handle INTO follower_name, follower_handle
  FROM profiles WHERE id = NEW.follower_id;
  
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle)
  VALUES (NEW.following_id, 'follow', NEW.follower_id, follower_name, follower_handle);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION handle_follow_notification();

-- התראה על תגובה
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  commenter_handle TEXT;
BEGIN
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT user_name, user_handle INTO commenter_name, commenter_handle
  FROM profiles WHERE id = NEW.user_id;
  
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id, comment_id, content)
  VALUES (post_author_id, 'comment', NEW.user_id, commenter_name, commenter_handle, NEW.post_id, NEW.id, LEFT(NEW.content, 100));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_comment_notification();

-- התראה על retweet
CREATE OR REPLACE FUNCTION public.handle_retweet_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  retweeter_name TEXT;
  retweeter_handle TEXT;
BEGIN
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.original_post_id;
  
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT user_name, user_handle INTO retweeter_name, retweeter_handle
  FROM profiles WHERE id = NEW.user_id;
  
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id, content)
  VALUES (post_author_id, 'retweet', NEW.user_id, retweeter_name, retweeter_handle, NEW.original_post_id, NEW.quote_text);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_retweet_notification
  AFTER INSERT ON retweets
  FOR EACH ROW
  EXECUTE FUNCTION handle_retweet_notification();

-- התראה על mention
CREATE OR REPLACE FUNCTION public.handle_mention_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_name TEXT;
  post_author_handle TEXT;
BEGIN
  SELECT user_name, user_handle INTO post_author_name, post_author_handle
  FROM profiles WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);
  
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id)
  VALUES (NEW.mentioned_user_id, 'mention', 
          (SELECT user_id FROM posts WHERE id = NEW.post_id),
          post_author_name, post_author_handle, NEW.post_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_mention_notification
  AFTER INSERT ON mentions
  FOR EACH ROW
  EXECUTE FUNCTION handle_mention_notification();