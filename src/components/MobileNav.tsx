import { Home, Search, Bell, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "בית", path: "/" },
    { icon: Search, label: "חיפוש", path: "/search" },
    { icon: Bell, label: "התראות", path: "/notifications" },
    { icon: MessageSquare, label: "הודעות", path: "/messages" },
    { icon: User, label: "פרופיל", path: "/profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
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
    </nav>
  );
};
