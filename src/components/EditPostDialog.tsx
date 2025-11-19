import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentContent: string;
  currentImage?: string;
  onSuccess: () => void;
}

export const EditPostDialog = ({ 
  open, 
  onOpenChange, 
  postId, 
  currentContent, 
  currentImage, 
  onSuccess 
}: EditPostDialogProps) => {
  const [content, setContent] = useState(currentContent);
  const [imageUrl, setImageUrl] = useState(currentImage || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          image: imageUrl || null,
        })
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "הפוסט עודכן בהצלחה!",
      });
      
      onOpenChange(false);
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
          <DialogTitle>עריכת פוסט</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="מה קורה?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
            maxLength={280}
          />
          <Input
            type="url"
            placeholder="קישור לתמונה (אופציונלי)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !content.trim() || content.length > 280}
              className="flex-1"
            >
              {loading ? "שומר..." : "שמור"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};