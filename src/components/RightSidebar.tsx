import { Search, MoreHorizontal, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface SuggestedUser {
  id: string;
  author_name: string;
  author_handle: string;
  user_id: string;
}

interface TrendingHashtag {
  tag: string;
  count: number;
}

export const RightSidebar = () => {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetchSuggestedUsers(user.id);
        fetchFollowing(user.id);
      }
    });
    fetchTrendingHashtags();
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

  const fetchTrendingHashtags = async () => {
    try {
      // Get all hashtag IDs with their post counts
      const { data: postHashtagsData, error: postError } = await supabase
        .from("post_hashtags")
        .select("hashtag_id");

      if (postError) {
        console.error("Error fetching post hashtags:", postError);
        return;
      }

      if (!postHashtagsData || postHashtagsData.length === 0) {
        return;
      }

      // Count occurrences of each hashtag
      const hashtagCounts = new Map<string, number>();
      postHashtagsData.forEach((item) => {
        const id = item.hashtag_id;
        hashtagCounts.set(id, (hashtagCounts.get(id) || 0) + 1);
      });

      // Get unique hashtag IDs
      const uniqueHashtagIds = Array.from(hashtagCounts.keys());

      // Fetch hashtag details
      const { data: hashtagsData, error: hashtagError } = await supabase
        .from("hashtags")
        .select("id, tag")
        .in("id", uniqueHashtagIds);

      if (hashtagError) {
        console.error("Error fetching hashtags:", hashtagError);
        return;
      }

      if (!hashtagsData) {
        return;
      }

      // Combine counts with hashtag data
      const trending = hashtagsData
        .map((hashtag) => ({
          tag: hashtag.tag,
          count: hashtagCounts.get(hashtag.id) || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTrendingHashtags(trending);
    } catch (error) {
      console.error("Error in fetchTrendingHashtags:", error);
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

      {trendingHashtags.length > 0 && (
        <div className="bg-muted rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-4">Trending Hashtags</h2>
          <div className="space-y-3">
            {trendingHashtags.map((hashtag, i) => (
              <Link
                key={hashtag.tag}
                to={`/hashtag/${hashtag.tag}`}
                className="block hover:bg-accent -mx-4 px-4 py-2 rounded-lg transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-4 w-4 text-primary" />
                      <h3 className="font-bold">#{hashtag.tag}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {hashtag.count} {hashtag.count === 1 ? "פוסט" : "פוסטים"}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary/20">
                    {i + 1}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
