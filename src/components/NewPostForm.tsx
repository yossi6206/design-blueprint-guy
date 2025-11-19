import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, X } from "lucide-react";

interface NewPostFormProps {
  onPostCreated: () => void;
  userName: string;
  userHandle: string;
}

export const NewPostForm = ({ onPostCreated, userName, userHandle }: NewPostFormProps) => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        author_name: userName,
        author_handle: userHandle,
        content: content.trim(),
        image: imageUrl || null,
      });

      if (error) throw error;

      setContent("");
      setImageUrl("");
      setShowImageInput(false);
      onPostCreated();
      toast({
        title: "הפוסט פורסם בהצלחה!",
      });
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
    <form onSubmit={handleSubmit} className="border-b border-border p-4">
      <Textarea
        placeholder="מה קורה?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-lg"
        maxLength={280}
      />
      
      {showImageInput && (
        <div className="mt-2 flex gap-2 animate-fade-in">
          <Input
            type="url"
            placeholder="הכנס קישור לתמונה"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowImageInput(false);
              setImageUrl("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <Image className="h-5 w-5 text-primary" />
          </Button>
          <span className={`text-sm ${content.length > 260 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {content.length}/280
          </span>
        </div>
        <Button type="submit" disabled={loading || !content.trim() || content.length > 280}>
          {loading ? "שולח..." : "פרסם"}
        </Button>
      </div>
    </form>
  );
};
