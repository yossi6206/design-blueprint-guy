import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { PostCard } from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  image?: string;
  created_at: string;
  user_id: string;
}

export default function Bookmarks() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
      fetchBookmarks(user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchBookmarks = async (userId: string) => {
    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select(`
        post_id,
        posts (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bookmarks) {
      const postsData = bookmarks
        .map((b: any) => b.posts)
        .filter((p: any) => p !== null);
      setPosts(postsData);
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-background justify-center pb-16 md:pb-0">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 max-w-[600px] border-x border-border w-full">
          <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b border-border p-3 md:p-4">
            <h1 className="text-lg md:text-xl font-bold">מועדפים</h1>
          </div>

          {posts.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-muted-foreground">
              <p className="text-lg md:text-xl font-semibold mb-2">אין לך פוסטים שמורים</p>
              <p className="text-sm md:text-base">שמור פוסטים שאתה רוצה לראות שוב</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                author={post.author_name}
                handle={post.author_handle}
                time={post.created_at}
                content={post.content}
                image={post.image}
                userId={post.user_id}
                currentUserId={currentUserId}
              />
            ))
          )}
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <MobileNav />
    </>
  );
}