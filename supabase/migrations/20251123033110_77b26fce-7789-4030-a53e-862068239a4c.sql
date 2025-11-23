-- Create function to create notification for likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_author_name TEXT;
  post_author_handle TEXT;
  liker_name TEXT;
  liker_handle TEXT;
BEGIN
  -- Get post author details
  SELECT user_id, author_name, author_handle INTO post_author_id, post_author_name, post_author_handle
  FROM posts WHERE id = NEW.post_id;
  
  -- Get liker details
  SELECT user_name, user_handle INTO liker_name, liker_handle
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't create notification if user likes their own post
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      actor_name,
      actor_handle,
      post_id,
      content
    ) VALUES (
      post_author_id,
      'like',
      NEW.user_id,
      liker_name,
      liker_handle,
      NEW.post_id,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes
DROP TRIGGER IF EXISTS on_like_created ON likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Create function to create notification for follows
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
  follower_handle TEXT;
BEGIN
  -- Get follower details
  SELECT user_name, user_handle INTO follower_name, follower_handle
  FROM profiles WHERE id = NEW.follower_id;
  
  INSERT INTO notifications (
    user_id,
    type,
    actor_id,
    actor_name,
    actor_handle,
    post_id,
    content
  ) VALUES (
    NEW.following_id,
    'follow',
    NEW.follower_id,
    follower_name,
    follower_handle,
    NULL,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for follows
DROP TRIGGER IF EXISTS on_follow_created ON follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Create function to create notification for comments
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  commenter_handle TEXT;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id
  FROM posts WHERE id = NEW.post_id;
  
  -- Get commenter details
  SELECT user_name, user_handle INTO commenter_name, commenter_handle
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't create notification if user comments on their own post
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      actor_name,
      actor_handle,
      post_id,
      comment_id,
      content
    ) VALUES (
      post_author_id,
      'comment',
      NEW.user_id,
      commenter_name,
      commenter_handle,
      NEW.post_id,
      NEW.id,
      LEFT(NEW.content, 100)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comments
DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Create function to create notification for retweets
CREATE OR REPLACE FUNCTION create_retweet_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  retweeter_name TEXT;
  retweeter_handle TEXT;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id
  FROM posts WHERE id = NEW.original_post_id;
  
  -- Get retweeter details
  SELECT user_name, user_handle INTO retweeter_name, retweeter_handle
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't create notification if user retweets their own post
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      actor_name,
      actor_handle,
      post_id,
      content
    ) VALUES (
      post_author_id,
      'retweet',
      NEW.user_id,
      retweeter_name,
      retweeter_handle,
      NEW.original_post_id,
      NEW.quote_text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for retweets
DROP TRIGGER IF EXISTS on_retweet_created ON retweets;
CREATE TRIGGER on_retweet_created
  AFTER INSERT ON retweets
  FOR EACH ROW
  EXECUTE FUNCTION create_retweet_notification();