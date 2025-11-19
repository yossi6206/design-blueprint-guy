import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageUpload } from "@/components/profile/ImageUpload";
import { Separator } from "@/components/ui/separator";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image: string | null;
  website: string | null;
  location: string | null;
  created_at?: string;
  updated_at?: string;
}

interface EditProfileDialogProps {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

export function EditProfileDialog({ profile, onProfileUpdate }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_name: profile.user_name,
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [coverImageUrl, setCoverImageUrl] = useState(profile.cover_image || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          user_name: formData.user_name,
          bio: formData.bio || null,
          location: formData.location || null,
          website: formData.website || null,
          avatar_url: avatarUrl || null,
          cover_image: coverImageUrl || null,
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      onProfileUpdate(data);
      toast.success("הפרופיל עודכן בהצלחה");
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("שגיאה בעדכון הפרופיל");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full px-6">
          ערוך פרופיל
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ערוך פרופיל</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* תמונות */}
          <div className="space-y-4">
            <div>
              <Label className="text-base mb-2 block">תמונת כיסוי</Label>
              <ImageUpload
                currentImageUrl={coverImageUrl}
                userId={profile.id}
                bucket="covers"
                onUploadComplete={setCoverImageUrl}
                className="w-full h-48"
              />
            </div>

            <div>
              <Label className="text-base mb-2 block">תמונת פרופיל</Label>
              <ImageUpload
                currentImageUrl={avatarUrl}
                userId={profile.id}
                bucket="avatars"
                onUploadComplete={setAvatarUrl}
                className="w-32 h-32"
                isAvatar={true}
              />
            </div>
          </div>

          <Separator />

          {/* פרטים אישיים */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם</Label>
              <Input
                id="name"
                value={formData.user_name}
                onChange={(e) =>
                  setFormData({ ...formData, user_name: e.target.value })
                }
                required
                maxLength={50}
              />
            </div>

          <div className="space-y-2">
            <Label htmlFor="bio">ביוגרפיה</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/160
            </p>
          </div>

            <div className="space-y-2">
              <Label htmlFor="location">מיקום</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">אתר אינטרנט</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
                maxLength={100}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "שומר..." : "שמור"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
