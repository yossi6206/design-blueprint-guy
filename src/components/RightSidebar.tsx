import { Search, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

interface TrendingHashtag {
  id: string;
  tag: string;
  post_count: number;
  recent_post_count: number;
}

export const RightSidebar = () => {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    const { data: usersByName } = await supabase
      .from("profiles")
      .select("*")
      .ilike("user_name", `%${query}%`)
      .limit(5);

    const { data: usersByHandle } = await supabase
      .from("profiles")
      .select("*")
      .ilike("user_handle", `%${query}%`)
      .limit(5);

    const allUsers = [...(usersByName || []), ...(usersByHandle || [])];
    const uniqueUsers = Array.from(
      new Map(allUsers.map(user => [user.id, user])).values()
    ).slice(0, 5);

    setSearchResults(uniqueUsers);
    setShowResults(uniqueUsers.length > 0);
  };

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from("trending_hashtags_view")
        .select("*");

      if (error) {
        console.error("Error fetching trending hashtags:", error);
        return;
      }

      setTrendingHashtags(data || []);
    } catch (error) {
      console.error("Error in fetchTrendingHashtags:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&tab=users`);
      setSearchQuery("");
    }
  };

  return (
    <div className="w-[350px] h-screen sticky top-0 px-6 py-2 overflow-y-auto scrollbar-hide">
      <div className="mb-4" ref={searchRef}>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="חיפוש משתמשים"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full pr-14 pl-4 py-3 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>
        
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-[calc(100%-3rem)] mt-2 bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
            {searchResults.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.user_handle}`}
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-all border-b border-border last:border-b-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground">
                    {user.user_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold truncate">{user.user_name}</span>
                    {user.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-background fill-primary shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">@{user.user_handle}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <SuggestedUsers limit={5} />
      </div>

      {trendingHashtags.length > 0 && (
        <div className="bg-muted rounded-2xl p-4 mb-4 border-2 border-transparent bg-gradient-to-br from-[hsl(203,89%,53%)]/5 to-[hsl(270,70%,60%)]/5 hover:border-[hsl(203,89%,53%)]/20 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-[hsl(203,89%,53%)]/10 to-[hsl(270,70%,60%)]/10 rounded-full p-2">
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
                        {hashtag.recent_post_count} פוסטים היום · {hashtag.post_count} סה"כ
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
