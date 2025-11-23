-- הוסף policy למחיקת הודעות
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
USING (auth.uid() = sender_id);