import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ImageUploadProps {
  currentImageUrl: string | null;
  userId: string;
  bucket: "avatars" | "covers";
  onUploadComplete: (url: string) => void;
  className?: string;
  isAvatar?: boolean;
}

export const ImageUpload = ({
  currentImageUrl,
  userId,
  bucket,
  onUploadComplete,
  className = "",
  isAvatar = false,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // בדיקת סוג הקובץ
    if (!file.type.startsWith("image/")) {
      toast({
        title: "שגיאה",
        description: "יש להעלות קובץ תמונה בלבד",
        variant: "destructive",
      });
      return;
    }

    // בדיקת גודל הקובץ
    const maxSize = bucket === "avatars" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "שגיאה",
        description: `הקובץ גדול מדי (מקסימום ${bucket === "avatars" ? "5MB" : "10MB"})`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // יצירת preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // העלאת הקובץ
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // מחיקת תמונה ישנה אם קיימת
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split(`${bucket}/`)[1];
        if (oldPath) {
          await supabase.storage.from(bucket).remove([oldPath]);
        }
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // קבלת URL הציבורי
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      onUploadComplete(publicUrl);

      toast({
        title: "הצלחה!",
        description: "התמונה הועלתה בהצלחה",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "שגיאה",
        description: error.message || "העלאת התמונה נכשלה",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;

    setUploading(true);
    try {
      const path = currentImageUrl.split(`${bucket}/`)[1];
      if (path) {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
      }

      onUploadComplete("");
      setPreviewUrl(null);

      toast({
        title: "הצלחה!",
        description: "התמונה הוסרה בהצלחה",
      });
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast({
        title: "שגיאה",
        description: "הסרת התמונה נכשלה",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  if (isAvatar) {
    return (
      <div className="relative">
        <Avatar className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}>
          <AvatarImage src={displayUrl || ""} />
          <AvatarFallback>
            <Camera className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div className="absolute bottom-0 left-0 flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
          
          {displayUrl && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {displayUrl ? (
        <div className="relative w-full h-full group">
          <img
            src={displayUrl}
            alt="Cover"
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:bg-accent transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Camera className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                לחץ להעלאת תמונה
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};
