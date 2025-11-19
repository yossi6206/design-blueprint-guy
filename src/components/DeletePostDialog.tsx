import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onSuccess: () => void;
}

export const DeletePostDialog = ({ open, onOpenChange, postId, onSuccess }: DeletePostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "הפוסט נמחק בהצלחה",
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת פוסט</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את הפוסט? לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "מוחק..." : "מחק"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};