import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bell, MessageSquare, User, LogOut, MoreHorizontal, Search, Bookmark, ShieldCheck, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  is_verified: boolean;
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

  const handleRequestVerification = () => {
    navigate("/verification");
  };
  return (
    <div className="w-[275px] h-screen sticky top-0 flex flex-col px-3 py-2 border-l border-border hidden md:flex">
      <div className="flex-1">
        {/* Logo */}
        <div className="mb-2 px-3 py-2 cursor-pointer min-h-[48px] flex items-center" onClick={() => navigate("/")}>
          <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0">
            <defs>
              <linearGradient id="sidebarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgb(147, 51, 234)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path fill="url(#sidebarGradient)" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
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

        {/* Request Verification Button - only if not verified */}
        {userProfile && !userProfile.is_verified && (
          <Button
            onClick={handleRequestVerification}
            variant="outline"
            className="w-full gap-2 border-primary/20 hover:bg-primary/10 mt-4"
          >
            <ShieldCheck className="w-4 h-4" />
            בקש תג מאומת
          </Button>
        )}
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
            <div className="font-bold text-sm truncate flex items-center gap-1">
              {userProfile.user_name}
              {userProfile.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-background fill-primary shrink-0" />
              )}
            </div>
            <div className="text-muted-foreground text-sm truncate">@{userProfile.user_handle}</div>
          </div>
          <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
        </button>
      )}
    </div>
  );
};
