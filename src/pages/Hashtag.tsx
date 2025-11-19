import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { PostCard } from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { Hash } from "lucide-react";

interface Post {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  image?: string;
  created_at: string;
  user_id: string;
}

export default function Hashtag() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (tag) {
      fetchHashtagPosts();
    }
  }, [tag]);

  const fetchHashtagPosts = async () => {
    // Find hashtag
    const { data: hashtagData } = await supabase
      .from("hashtags")
      .select("id")
      .eq("tag", tag)
      .maybeSingle();

    if (!hashtagData) {
      setPosts([]);
      return;
    }

    // Get posts with this hashtag
    const { data: postHashtags } = await supabase
      .from("post_hashtags")
      .select(`
        post_id,
        posts (*)
      `)
      .eq("hashtag_id", hashtagData.id);

    if (postHashtags) {
      const postsData = postHashtags
        .map((ph: any) => ph.posts)
        .filter((p: any) => p !== null)
        .sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      setPosts(postsData);
      setPostsCount(postsData.length);
    }
  };

  return (
    <div className="flex min-h-screen bg-background justify-center">
      <Sidebar />
      
      <main className="flex-1 max-w-[600px] border-x border-border">
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b border-border">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">{tag}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {postsCount} {postsCount === 1 ? "פוסט" : "פוסטים"}
            </p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-xl font-semibold mb-2">אין פוסטים עם ה-hashtag הזה</p>
            <p>היה הראשון לפרסם!</p>
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

      <RightSidebar />
    </div>
  );
}