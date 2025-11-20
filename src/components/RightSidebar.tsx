import { Search, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";

interface TrendingHashtag {
  tag: string;
  count: number;
}

export const RightSidebar = () => {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

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

      <SuggestedUsers limit={5} />

      {trendingHashtags.length > 0 && (
        <div className="bg-muted rounded-2xl p-4 mb-4 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/10 rounded-full p-2">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">נושאים חמים</h2>
          </div>
          <div className="space-y-2">
            {trendingHashtags.map((hashtag, i) => (
              <Link
                key={hashtag.tag}
                to={`/hashtag/${hashtag.tag}`}
                className="block hover:bg-accent/50 -mx-4 px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">#{hashtag.tag}</h3>
                      <p className="text-xs text-muted-foreground">
                        {hashtag.count} {hashtag.count === 1 ? "פוסט" : "פוסטים"}
                      </p>
                    </div>
                  </div>
                  <Hash className="h-4 w-4 text-primary/40 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
