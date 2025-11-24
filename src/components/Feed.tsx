import { useState, useEffect } from "react";
import { PostCard } from "./PostCard";
import { NewPostForm } from "./NewPostForm";
import { Notifications } from "./Notifications";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Post {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  image?: string;
  created_at: string;
  user_id: string;
  engagement_score?: number;
  is_boosted?: boolean;
  likes_count?: number;
  comments_count?: number;
  retweets_count?: number;
  boosts_count?: number;
}

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>("משתמש");
  const [userHandle, setUserHandle] = useState<string>("user");
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setCurrentUserId(user.id);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      // If no profile exists, create one
      if (!profile) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            user_name: user.email?.split("@")[0] || "משתמש",
            user_handle: `user_${user.id.substring(0, 8)}`,
          })
          .select()
          .single();
        
        if (newProfile) {
          setUserName(newProfile.user_name);
          setUserHandle(newProfile.user_handle);
        }
      } else {
        setUserName(profile.user_name);
        setUserHandle(profile.user_handle);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    fetchPosts();
    fetchFollowingPosts();

    const postsChannel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setHasNewPosts(true);
          }
          fetchPosts();
          fetchFollowingPosts();
        }
      )
      .subscribe();

    const boostsChannel = supabase
      .channel("boosts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_boosts",
        },
        () => {
          fetchPosts();
          fetchFollowingPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(boostsChannel);
    };
  }, [user, currentUserId]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("post_engagement_view")
      .select("*")
      .order("engagement_score", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data || []);
    }
  };

  const fetchFollowingPosts = async () => {
    if (!currentUserId) return;

    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (following && following.length > 0) {
      const followingIds = following.map((f) => f.following_id);
      
      const { data, error } = await supabase
        .from("post_engagement_view")
        .select("*")
        .in("user_id", followingIds)
        .order("engagement_score", { ascending: false });

      if (!error) {
        setFollowingPosts(data || []);
      }
    } else {
      setFollowingPosts([]);
    }
  };

  const handleRefreshFeed = () => {
    setHasNewPosts(false);
    fetchPosts();
    fetchFollowingPosts();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}ש`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}ד`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}ש`;
    const days = Math.floor(hours / 24);
    return `${days}י`;
  };

  if (!user) return null;
  
  return (
    <div className="flex-1 border-r border-border max-w-[600px] w-full">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex justify-between items-center p-3 md:p-4 gap-2">
          <h1 className="text-lg md:text-xl font-bold">הבית</h1>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="md:block hidden">
              <Notifications />
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 md:h-10 md:w-10">
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </div>

      {hasNewPosts && (
        <div 
          className="sticky top-[73px] z-20 bg-primary text-primary-foreground px-4 py-2 text-center cursor-pointer hover:bg-primary/90 transition-colors"
          onClick={handleRefreshFeed}
        >
          <p className="text-sm font-medium">יש פוסטים חדשים - לחץ לרענון</p>
        </div>
      )}

      <NewPostForm 
        onPostCreated={() => {
          fetchPosts();
          fetchFollowingPosts();
        }}
        userName={userName}
        userHandle={userHandle}
      />

      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="w-full grid grid-cols-2 sticky top-[73px] z-10 rounded-none border-b">
          <TabsTrigger value="for-you">בשבילך</TabsTrigger>
          <TabsTrigger value="following">עוקבים</TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="mt-0">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              author={post.author_name}
              handle={post.author_handle}
              time={getTimeAgo(post.created_at)}
              content={post.content}
              image={post.image}
              userId={post.user_id}
              currentUserId={currentUserId}
              isBoosted={post.is_boosted}
              initialLikesCount={post.likes_count}
              initialCommentsCount={post.comments_count}
              initialRetweetsCount={post.retweets_count}
              initialBoostsCount={post.boosts_count}
            />
          ))}
        </TabsContent>

        <TabsContent value="following" className="mt-0">
          {followingPosts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>אין פוסטים ממשתמשים שאתה עוקב אחריהם</p>
              <p className="text-sm mt-2">עקוב אחרי משתמשים כדי לראות את הפוסטים שלהם כאן</p>
            </div>
          ) : (
            followingPosts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                author={post.author_name}
                handle={post.author_handle}
                time={getTimeAgo(post.created_at)}
                content={post.content}
                image={post.image}
                userId={post.user_id}
                currentUserId={currentUserId}
                isBoosted={post.is_boosted}
                initialLikesCount={post.likes_count}
                initialCommentsCount={post.comments_count}
                initialRetweetsCount={post.retweets_count}
                initialBoostsCount={post.boosts_count}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
