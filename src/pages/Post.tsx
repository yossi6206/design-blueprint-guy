import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  image: string | null;
  media_type?: string | null;
  created_at: string;
  author_name: string;
  author_handle: string;
  user_id: string;
}

export default function Post() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (postError) throw postError;
        
        if (!postData) {
          toast.error("פוסט לא נמצא");
          navigate("/");
          return;
        }
        
        setPost(postData);
      } catch (error: any) {
        console.error("Error fetching post:", error);
        toast.error("פוסט לא נמצא");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <div className="flex min-h-screen bg-background justify-center pb-16 md:pb-0">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="w-full max-w-2xl md:border-x border-border">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-3 md:p-4">
            <div className="flex items-center gap-4 md:gap-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-bold">פוסט</h1>
              </div>
            </div>
          </div>

          {/* Post */}
          <PostCard
            postId={post.id}
            author={post.author_name}
            handle={post.author_handle}
            time={new Date(post.created_at).toLocaleDateString("he-IL")}
            content={post.content}
            image={post.image || undefined}
            mediaType={post.media_type}
            userId={post.user_id}
            currentUserId={currentUser?.id}
            showComments={true}
          />
        </div>
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <MobileNav />
    </>
  );
}
