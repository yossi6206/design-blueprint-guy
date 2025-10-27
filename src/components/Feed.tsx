import { useState, useEffect } from "react";
import { PostCard } from "./PostCard";
import { NewPostForm } from "./NewPostForm";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

interface Post {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  image?: string;
  created_at: string;
}

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    fetchPosts();

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (!user) return null;
  return (
    <div className="flex-1 border-r border-border max-w-[600px]">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">הבית</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* New Post Form */}
      <NewPostForm 
        onPostCreated={fetchPosts}
        userName={user?.user_metadata?.name || "משתמש"}
        userHandle={user?.user_metadata?.handle || "user"}
      />

      {/* Posts */}
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            author={post.author_name}
            handle={post.author_handle}
            time={getTimeAgo(post.created_at)}
            content={post.content}
            image={post.image}
            verified={false}
            comments={0}
            retweets={0}
            likes={0}
            views={0}
          />
        ))}
      </div>
    </div>
  );
};
