import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RetweetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  originalAuthor: string;
  originalContent: string;
  onSuccess: () => void;
}

export const RetweetDialog = ({ 
  open, 
  onOpenChange, 
  postId, 
  originalAuthor, 
  originalContent, 
  onSuccess 
}: RetweetDialogProps) => {
  const [quoteText, setQuoteText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRetweet = async (withQuote: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("retweets").insert({
        user_id: user.id,
        original_post_id: postId,
        quote_text: withQuote ? quoteText : null,
      });

      if (error) throw error;

      toast({
        title: withQuote ? "ציטוט פורסם!" : "פוסט שותף!",
      });
      
      onOpenChange(false);
      setQuoteText("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>שיתוף פוסט</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="הוסף תגובה (אופציונלי)"
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            className="min-h-[100px]"
            maxLength={280}
          />
          <div className="border border-border rounded-lg p-3 bg-muted/30">
            <p className="font-semibold text-sm">{originalAuthor}</p>
            <p className="text-sm mt-1">{originalContent}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleRetweet(false)}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              שיתוף
            </Button>
            <Button
              onClick={() => handleRetweet(true)}
              disabled={loading || !quoteText.trim()}
              className="flex-1"
            >
              ציטוט
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};