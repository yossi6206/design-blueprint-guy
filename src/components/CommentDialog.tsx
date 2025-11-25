import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentUserId: string;
  onCommentAdded?: () => void;
}

export const CommentDialog = ({ 
  open, 
  onOpenChange, 
  postId, 
  currentUserId,
  onCommentAdded 
}: CommentDialogProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין תגובה",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_name, user_handle")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Insert comment
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: content.trim(),
        author_name: profile.user_name,
        author_handle: profile.user_handle,
      });

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "התגובה נוספה בהצלחה",
      });

      setContent("");
      onOpenChange(false);
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "שגיאה",
        description: "שליחת התגובה נכשלה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-right">כתוב תגובה...</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="כתוב את התגובה שלך..."
            className="min-h-[120px] resize-none text-right"
            disabled={isSubmitting}
            maxLength={280}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{content.length}/280</span>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              הגב
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
