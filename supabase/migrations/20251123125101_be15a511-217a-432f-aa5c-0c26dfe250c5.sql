-- Create function to handle conversation creation with participants
CREATE OR REPLACE FUNCTION create_conversation_with_participants(
  other_user_id UUID
) RETURNS UUID AS $$
DECLARE
  new_conversation_id UUID;
  existing_conversation_id UUID;
BEGIN
  -- Check if conversation already exists between these users
  SELECT cp1.conversation_id INTO existing_conversation_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2 
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = auth.uid() 
    AND cp2.user_id = other_user_id
  LIMIT 1;
  
  -- Return existing conversation if found
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;
  
  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (new_conversation_id, auth.uid()),
    (new_conversation_id, other_user_id);
  
  RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;