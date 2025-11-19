import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookmarkButtonProps {
  postId: string;
  currentUserId?: string;
}

export const BookmarkButton = ({ postId, currentUserId }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId) {
      checkBookmarkStatus();
    }
  }, [postId, currentUserId]);

  const checkBookmarkStatus = async () => {
    if (!currentUserId) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    setIsBookmarked(!!data);
  };

  const handleBookmark = async () => {
    if (!currentUserId) {
      toast({
        title: "התחבר כדי לשמור פוסטים",
        variant: "destructive",
      });
      return;
    }

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);

      if (!error) {
        setIsBookmarked(false);
        toast({
          title: "הוסר מהמועדפים",
        });
      }
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert({ post_id: postId, user_id: currentUserId });

      if (!error) {
        setIsBookmarked(true);
        toast({
          title: "נשמר למועדפים!",
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBookmark}
      className="hover:text-primary"
    >
      <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current text-primary" : ""}`} />
    </Button>
  );
};