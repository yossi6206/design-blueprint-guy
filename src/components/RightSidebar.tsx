import { Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const newsItems = [
  {
    category: "Politics · Trending",
    title: "Mossad",
    posts: "24.9K posts",
  },
  {
    category: "Trending in Israel",
    title: "של נגיד",
    posts: "",
  },
];

const trending = [
  {
    title: "Mamdani Rallies 10,000 in Queens with Sanders, AOC, and Hochul Endorsements",
    category: "News",
    time: "11 hours ago",
    posts: "176.2K posts",
  },
  {
    title: "Austin Reaves Drops Career-High 51 Points in Lakers' Victory Over Kings",
    category: "Sports",
    time: "8 hours ago",
    posts: "75.6K posts",
  },
  {
    title: "Lando Norris Wins Mexico GP, Leads F1 Drivers' Championship by One Point Over...",
    category: "Sports",
    time: "2 days ago",
    posts: "274.3K posts",
  },
];

interface SuggestedUser {
  id: string;
  author_name: string;
  author_handle: string;
  user_id: string;
}

export const RightSidebar = () => {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetchSuggestedUsers(user.id);
        fetchFollowing(user.id);
      }
    });
  }, []);

  const fetchFollowing = async (userId: string) => {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (data) {
      setFollowingIds(new Set(data.map((f) => f.following_id)));
    }
  };

  const fetchSuggestedUsers = async (userId: string) => {
    const { data } = await supabase
      .from("posts")
      .select("author_name, author_handle, user_id")
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      const uniqueUsers = Array.from(
        new Map(data.map((user) => [user.user_id, user])).values()
      ).slice(0, 3);
      setSuggestedUsers(uniqueUsers as SuggestedUser[]);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUserId) return;

    if (followingIds.has(userId)) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      if (!error) {
        setFollowingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast({ title: "הפסקת לעקוב" });
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: userId });

      if (!error) {
        setFollowingIds((prev) => new Set(prev).add(userId));
        toast({ title: "עוקב!" });
      }
    }
  };

  return (
    <div className="w-[350px] h-screen sticky top-0 px-6 py-2">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש"
            className="w-full pr-14 pl-4 py-3 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-4 mb-4">
        <h2 className="text-xl font-bold mb-2">הירשם לפרימיום</h2>
        <p className="text-sm mb-3">
          הירשם כדי לפתוח תכונות חדשות ואם כשיר, לקבל חלק מהכנסות הפרסום.
        </p>
        <Button className="rounded-full font-bold bg-primary hover:bg-hover-primary">
          הירשם
        </Button>
      </div>

      {suggestedUsers.length > 0 && (
        <div className="bg-muted rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-4">מי לעקוב</h2>
          <div className="space-y-4">
            {suggestedUsers.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.author_handle}`}
                    />
                    <AvatarFallback>{user.author_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{user.author_name}</p>
                    <p className="text-muted-foreground text-xs">@{user.author_handle}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={followingIds.has(user.user_id) ? "outline" : "default"}
                  onClick={() => handleFollow(user.user_id)}
                >
                  {followingIds.has(user.user_id) ? "עוקב" : "עקוב"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-muted rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">חדשות היום</h2>
          <button>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {trending.map((item, i) => (
            <div key={i} className="hover:bg-hover-bg -mx-4 px-4 py-2 rounded-lg transition-colors cursor-pointer">
              <div className="flex gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.category}</span>
                  <span>·</span>
                  <span>{item.time}</span>
                </div>
              </div>
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.posts}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">מה קורה</h2>
        <div className="space-y-4">
          <div className="text-right mb-2">
            <span className="text-lg font-bold">תרמיל קליין</span>
          </div>
          {newsItems.map((item, i) => (
            <div key={i} className="hover:bg-hover-bg -mx-4 px-4 py-2 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                  <h3 className="font-bold">{item.title}</h3>
                  {item.posts && (
                    <p className="text-xs text-muted-foreground mt-1">{item.posts}</p>
                  )}
                </div>
                <button>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button className="text-primary hover:underline text-sm">הצג עוד</button>
        </div>
      </div>
    </div>
  );
};
