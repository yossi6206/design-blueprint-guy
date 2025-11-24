import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPostForm } from "@/components/NewPostForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const FloatingPostButton = () => {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userHandle, setUserHandle] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_name, user_handle")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.user_name);
          setUserHandle(profile.user_handle);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handlePostCreated = () => {
    setIsPostDialogOpen(false);
  };

  return (
    <>
      {/* Floating Action Button - visible only on desktop */}
      <Button
        onClick={() => setIsPostDialogOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 h-14 w-14 rounded-full bg-gradient-primary text-white hover:opacity-90 shadow-xl hover:shadow-2xl transition-all z-40 items-center justify-center hover:scale-105"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פוסט חדש</DialogTitle>
          </DialogHeader>
          <NewPostForm
            onPostCreated={handlePostCreated}
            userName={userName}
            userHandle={userHandle}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
