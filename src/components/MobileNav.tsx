import { useState, useEffect } from "react";
import { Home, Search, Bell, MessageSquare, User, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPostForm } from "@/components/NewPostForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const MobileNav = () => {
  const location = useLocation();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userHandle, setUserHandle] = useState("");
  
  const navItems = [
    { icon: Home, label: "בית", path: "/" },
    { icon: Search, label: "חיפוש", path: "/search" },
    { icon: Bell, label: "התראות", path: "/notifications" },
    { icon: MessageSquare, label: "הודעות", path: "/messages" },
    { icon: User, label: "פרופיל", path: "/profile" },
  ];

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex flex-col">
          {/* Navigation Items */}
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isActive && "fill-primary")} />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Post Button */}
          <div className="px-4 pb-4 pt-2">
            <Button
              onClick={() => setIsPostDialogOpen(true)}
              className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold text-base"
            >
              Post
            </Button>
          </div>
        </div>
      </nav>

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
