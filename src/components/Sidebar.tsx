import { Home, Search, Bell, Mail, Hash, Bookmark, Users, CreditCard, User, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: Search, label: "Explore" },
  { icon: Bell, label: "Notifications" },
  { icon: Mail, label: "Messages" },
  { icon: Hash, label: "Grok" },
  { icon: Bookmark, label: "Lists" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: Users, label: "Communities" },
  { icon: CreditCard, label: "Premium" },
  { icon: User, label: "Profile" },
  { icon: MoreHorizontal, label: "More" },
];

export const Sidebar = () => {
  return (
    <div className="w-[275px] h-screen sticky top-0 flex flex-col px-3 py-2 border-r border-border">
      <div className="flex-1">
        {/* Logo */}
        <div className="mb-2 px-3 py-2">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-5 px-3 py-3 rounded-full transition-colors ${
                item.active
                  ? "font-bold"
                  : "hover:bg-hover-bg"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xl">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Post Button */}
        <Button className="w-[90%] mt-4 py-6 text-lg font-bold rounded-full bg-primary hover:bg-hover-primary">
          Post
        </Button>
      </div>

      {/* Profile Button */}
      <button className="flex items-center gap-3 p-3 rounded-full hover:bg-hover-bg transition-colors w-full mt-auto">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-sm">Yossi Cohen</div>
          <div className="text-muted-foreground text-sm">@Yossi6206Cohen</div>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
};
