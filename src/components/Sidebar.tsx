import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bell, MessageSquare, User, LogOut, MoreHorizontal, Search, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItems = [
    { icon: Home, label: "בית", path: "/" },
    { icon: Search, label: "חיפוש", path: "/search" },
    { icon: Bell, label: "התראות", path: "/notifications" },
    { icon: MessageSquare, label: "הודעות", path: "/messages" },
    { icon: Bookmark, label: "מועדפים", path: "/bookmarks" },
    { icon: User, label: "פרופיל", path: userProfile ? `/profile/${userProfile.user_handle}` : "/profile" },
  ];
  return (
    <div className="w-[275px] h-screen sticky top-0 flex flex-col px-3 py-2 border-l border-border hidden md:flex">
      <div className="flex-1">
        {/* Logo */}
        <div className="mb-2 px-3 py-2 cursor-pointer min-h-[48px] flex items-center" onClick={() => navigate("/")}>
          <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-5 px-3 py-3 rounded-full transition-colors ${
                location.pathname === item.path
                  ? "font-bold"
                  : "hover:bg-accent"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xl">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-5 px-3 py-3 rounded-full transition-colors hover:bg-accent text-destructive"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xl">יציאה</span>
          </button>
        </nav>
      </div>

      {/* Profile Button */}
      {userProfile && (
        <button
          onClick={() => navigate(`/profile/${userProfile.user_handle}`)}
          className="flex items-center gap-3 p-3 rounded-full hover:bg-accent transition-colors w-full mt-auto min-h-[64px]"
        >
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={userProfile.avatar_url || ""} />
            <AvatarFallback>{userProfile.user_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-right min-w-0">
            <div className="font-bold text-sm truncate">{userProfile.user_name}</div>
            <div className="text-muted-foreground text-sm truncate">@{userProfile.user_handle}</div>
          </div>
          <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
        </button>
      )}
    </div>
  );
};
