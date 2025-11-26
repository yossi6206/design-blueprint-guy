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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
        {/* Post Button - Shows on all pages */}
        <div className="px-3 pt-3 pb-2 border-b border-border">
          <Button
            onClick={() => setIsPostDialogOpen(true)}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[hsl(203,89%,53%)] to-[hsl(270,70%,60%)] text-white hover:opacity-90 font-bold text-base shadow-sm transition-opacity"
          >
            פוסט חדש
          </Button>
        </div>
        
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
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative",
                  isActive ? "" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon 
                  className="h-6 w-6" 
                  style={isActive ? {
                    stroke: 'url(#mobileNavGradient)',
                    fill: 'none'
                  } : undefined}
                />
                <span 
                  className={cn(
                    "text-xs mt-1",
                    isActive && "bg-gradient-to-r from-[hsl(203,89%,53%)] to-[hsl(270,70%,60%)] text-transparent bg-clip-text font-semibold"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                      <linearGradient id="mobileNavGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'hsl(203, 89%, 53%)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(270, 70%, 60%)', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </Link>
            );
          })}
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
