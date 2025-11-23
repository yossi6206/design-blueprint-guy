
-- Add INSERT policy for conversations table to allow users to create new conversations
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO public
  WITH CHECK (true);
