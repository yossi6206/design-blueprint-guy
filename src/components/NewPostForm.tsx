import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Image, X, Video, Loader2 } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

interface NewPostFormProps {
  onPostCreated: () => void;
  userName: string;
  userHandle: string;
}

export const NewPostForm = ({ onPostCreated, userName, userHandle }: NewPostFormProps) => {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 52428800) {
      toast({
        title: "הקובץ גדול מדי",
        description: "גודל מקסימלי: 50MB",
        variant: "destructive",
      });
      return;
    }

    // Determine media type
    const type = file.type.startsWith("video/") ? "video" : "image";
    setMediaType(type);
    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview("");
    setMediaType(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadMedia = async (userId: string): Promise<{ url: string; fileName: string; fileSize: number } | null> => {
    if (!mediaFile) return null;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = mediaFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const { error: uploadError, data } = await supabase.storage
        .from("post-media")
        .upload(fileName, mediaFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        fileName,
        fileSize: mediaFile.size
      };
    } catch (error: any) {
      toast({
        title: "שגיאה בהעלאת קובץ",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload media if exists
      let mediaUrl: string | null = null;
      let mediaData: { url: string; fileName: string; fileSize: number } | null = null;
      if (mediaFile) {
        mediaData = await uploadMedia(user.id);
        if (!mediaData && mediaFile) {
          // Upload failed
          setLoading(false);
          return;
        }
        mediaUrl = mediaData.url;
      }

      const { data: post, error } = await supabase.from("posts").insert({
        user_id: user.id,
        author_name: userName,
        author_handle: userHandle,
        content: content.trim(),
        image: mediaUrl,
        media_type: mediaType,
      }).select().single();

      if (error) throw error;

      // Save media record to database
      if (mediaData && mediaType) {
        await supabase.from("media").insert({
          user_id: user.id,
          file_url: mediaData.url,
          file_type: mediaType,
          file_size: mediaData.fileSize,
          post_id: post.id,
        });
      }

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

          // Create notification for mentioned user
          await supabase.from("notifications").insert({
            user_id: profile.id,
            actor_id: user.id,
            actor_name: userName,
            actor_handle: userHandle,
            type: "mention",
            post_id: post.id,
            content: content.substring(0, 100),
          });
        }
      }

      setContent("");
      clearMedia();
      setUploadProgress(0);
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
      
      {mediaPreview && (
        <div className="mt-3 space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-border">
            {mediaType === "video" ? (
              <video
                src={mediaPreview}
                controls
                className="w-full max-h-[400px] object-cover"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-full max-h-[400px] object-cover"
              />
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={clearMedia}
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {uploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {uploadProgress}% - מעלה קובץ...
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex justify-between items-center mt-3">
        <div className="flex gap-1 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !!mediaFile}
          >
            <Image className="h-5 w-5 text-primary" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "video/*";
                fileInputRef.current.click();
                fileInputRef.current.accept = "image/*,video/*";
              }
            }}
            disabled={uploading || !!mediaFile}
          >
            <Video className="h-5 w-5 text-primary" />
          </Button>
          <EmojiPicker onEmojiSelect={(emoji) => setContent(content + emoji)} />
          <span className={`text-sm ${content.length > 260 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {content.length}/280
          </span>
        </div>
        <Button type="submit" disabled={loading || uploading || !content.trim() || content.length > 280}>
          {loading || uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              {uploading ? "מעלה..." : "שולח..."}
            </>
          ) : (
            "פרסם"
          )}
        </Button>
      </div>
    </form>
  );
};
