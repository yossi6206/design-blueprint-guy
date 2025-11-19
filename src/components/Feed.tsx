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
}

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>("משתמש");
  const [userHandle, setUserHandle] = useState<string>("user");
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

    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts();
          fetchFollowingPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentUserId]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

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
        .from("posts")
        .select("*")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });

      if (!error) {
        setFollowingPosts(data || []);
      }
    } else {
      setFollowingPosts([]);
    }
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
    <div className="flex-1 border-r border-border max-w-[600px]">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex justify-between items-center p-4 gap-2">
          <h1 className="text-xl font-bold">הבית</h1>
          <div className="flex items-center gap-2">
            <Notifications />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

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
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
