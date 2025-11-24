import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, X } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

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

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: post, error } = await supabase.from("posts").insert({
        user_id: user.id,
        author_name: userName,
        author_handle: userHandle,
        content: content.trim(),
        image: imageUrl || null,
      }).select().single();

      if (error) throw error;

      // Process hashtags
      const hashtags = extractHashtags(content);
      for (const tag of hashtags) {
        const { data: existingTag } = await supabase
          .from("hashtags")
          .select("id")
          .eq("tag", tag)
          .maybeSingle();

        let hashtagId;
        if (existingTag) {
          hashtagId = existingTag.id;
        } else {
          const { data: newTag } = await supabase
            .from("hashtags")
            .insert({ tag })
            .select()
            .single();
          hashtagId = newTag?.id;
        }

        if (hashtagId) {
          await supabase.from("post_hashtags").insert({
            post_id: post.id,
            hashtag_id: hashtagId,
          });
        }
      }

      // Process mentions
      const mentions = extractMentions(content);
      for (const handle of mentions) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_handle", handle)
          .maybeSingle();

        if (profile) {
          await supabase.from("mentions").insert({
            post_id: post.id,
            mentioned_user_id: profile.id,
            mentioned_handle: handle,
          });
        }
      }

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
    <form onSubmit={handleSubmit} className="border-b border-border p-3 md:p-4">
      <Textarea
        placeholder="מה קורה?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] md:min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base md:text-lg"
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
        <div className="flex gap-1 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <Image className="h-5 w-5 text-primary" />
          </Button>
          <EmojiPicker onEmojiSelect={(emoji) => setContent(content + emoji)} />
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
