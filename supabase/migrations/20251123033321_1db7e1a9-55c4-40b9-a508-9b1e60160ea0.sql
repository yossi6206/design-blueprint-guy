-- Fix search_path for notification functions
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_author_name TEXT;
  post_author_handle TEXT;
  liker_name TEXT;
  liker_handle TEXT;
BEGIN
  SELECT user_id, author_name, author_handle INTO post_author_id, post_author_name, post_author_handle
  FROM posts WHERE id = NEW.post_id;
  
  SELECT user_name, user_handle INTO liker_name, liker_handle
  FROM profiles WHERE id = NEW.user_id;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
  follower_handle TEXT;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  commenter_handle TEXT;
BEGIN
  SELECT user_id INTO post_author_id
  FROM posts WHERE id = NEW.post_id;
  
  SELECT user_name, user_handle INTO commenter_name, commenter_handle
  FROM profiles WHERE id = NEW.user_id;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION create_retweet_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  retweeter_name TEXT;
  retweeter_handle TEXT;
BEGIN
  SELECT user_id INTO post_author_id
  FROM posts WHERE id = NEW.original_post_id;
  
  SELECT user_name, user_handle INTO retweeter_name, retweeter_handle
  FROM profiles WHERE id = NEW.user_id;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';