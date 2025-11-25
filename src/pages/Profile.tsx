import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Link2, MapPin, Calendar, MoreHorizontal, BadgeCheck } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image: string | null;
  website: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
}

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

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post: {
    id: string;
    content: string;
    author_name: string;
    author_handle: string;
    user_id: string;
  };
}

interface Media {
  id: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export default function Profile() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!handle) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_handle", handle)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (!profileData) {
          toast.error("פרופיל לא נמצא");
          navigate("/");
          return;
        }
        setProfile(profileData);

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);

        // Fetch user media
        const { data: mediaData, error: mediaError } = await supabase
          .from("media")
          .select("*")
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false });

        if (mediaError) throw mediaError;
        setMedia(mediaData || []);

        // Fetch user comments with post details
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(`
            id,
            content,
            created_at,
            post_id,
            posts!inner(id, content, author_name, author_handle, user_id)
          `)
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false });

        if (commentsError) throw commentsError;
        
        // Transform the data to match our interface
        const transformedComments = (commentsData || []).map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          post_id: comment.post_id,
          post: comment.posts
        }));
        
        setComments(transformedComments);

        // Fetch liked posts
        const { data: likesData, error: likesError } = await supabase
          .from("likes")
          .select(`
            created_at,
            posts!inner(*)
          `)
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false });

        if (likesError) throw likesError;
        
        // Transform the data to match our interface
        const transformedLikes = (likesData || []).map((like: any) => ({
          ...like.posts,
          liked_at: like.created_at
        }));
        
        setLikedPosts(transformedLikes);

        // Check if current user follows this profile
        if (currentUser && currentUser.id !== profileData.id) {
          const { data: followData } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", currentUser.id)
            .eq("following_id", profileData.id)
            .maybeSingle();

          setIsFollowing(!!followData);
        }

        // Get followers count
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileData.id);

        setFollowersCount(followersCount || 0);

        // Get following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileData.id);

        setFollowingCount(followingCount || 0);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast.error("פרופיל לא נמצא");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [handle, currentUser, navigate]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
        toast.success("הפסקת לעקוב");
      } else {
        await supabase
          .from("follows")
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id,
          });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success("עוקב");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("שגיאה");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const joinDate = new Date(profile.created_at).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });

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
                onClick={() => navigate("/")}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-1">
                  <h1 className="text-lg md:text-xl font-bold">{profile.user_name}</h1>
                  {profile.is_verified && (
                    <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-background fill-primary" />
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{posts.length} פוסטים</p>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="h-32 md:h-48 bg-muted">
            {profile.cover_image && (
              <img
                src={profile.cover_image}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-3 md:px-4 pb-4">
            <div className="flex justify-between items-start -mt-12 md:-mt-16 mb-4">
              <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-background">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-2xl md:text-4xl">
                  {profile.user_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-12 md:mt-16 flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                  <MoreHorizontal className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              {isOwnProfile ? (
                <EditProfileDialog 
                  profile={profile} 
                  onProfileUpdate={(updatedProfile) => {
                    setProfile({ ...profile, ...updatedProfile });
                  }} 
                />
              ) : (
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className="rounded-full px-4 md:px-6 text-sm md:text-base h-8 md:h-10"
                >
                  {isFollowing ? "עוקב" : "עקוב"}
                </Button>
              )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1">
                  <h2 className="text-lg md:text-xl font-bold">{profile.user_name}</h2>
                  {profile.is_verified && (
                    <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-background fill-primary" />
                  )}
                </div>
                <p className="text-sm md:text-base text-muted-foreground">@{profile.user_handle}</p>
              </div>

              {profile.bio && <p className="text-sm md:text-base">{profile.bio}</p>}

              <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Link2 className="h-3 w-3 md:h-4 md:w-4" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[150px] md:max-w-none"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  <span>הצטרף {joinDate}</span>
                </div>
              </div>

              <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
                <Link 
                  to={`/profile/${handle}/followers?tab=following`}
                  className="hover:underline"
                >
                  <span className="font-bold">{followingCount}</span>{" "}
                  <span className="text-muted-foreground">עוקב</span>
                </Link>
                <Link 
                  to={`/profile/${handle}/followers?tab=followers`}
                  className="hover:underline"
                >
                  <span className="font-bold">{followersCount}</span>{" "}
                  <span className="text-muted-foreground">עוקבים</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full justify-around rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger
                value="posts"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm md:text-base py-3"
              >
                פוסטים {posts.length > 0 && `(${posts.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="replies"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm md:text-base py-3"
              >
                תגובות {comments.length > 0 && `(${comments.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm md:text-base py-3"
              >
                מדיה {media.length > 0 && `(${media.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm md:text-base py-3"
              >
                לייקים {likedPosts.length > 0 && `(${likedPosts.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              {posts.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
                  אין פוסטים עדיין
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    postId={post.id}
                    author={post.author_name}
                    handle={post.author_handle}
                    time={new Date(post.created_at).toLocaleDateString("he-IL")}
                    content={post.content}
                    image={post.image || undefined}
                    mediaType={post.media_type}
                    userId={post.user_id}
                    currentUserId={currentUser?.id}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="replies" className="mt-0">
              {comments.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
                  אין תגובות עדיין
                </div>
              ) : (
                comments.map((comment) => (
                  <Link
                    key={comment.id}
                    to={`/post/${comment.post_id}`}
                    className="block border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="text-xs md:text-sm text-muted-foreground mb-2">
                      תגובה על פוסט של{" "}
                      <span className="text-primary hover:underline font-semibold">
                        @{comment.post.author_handle}
                      </span>
                    </div>
                    <div className="mb-3 p-3 bg-muted/50 rounded-lg border-r-2 border-primary/50">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {comment.post.content}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback>
                          {profile?.user_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm md:text-base truncate">
                            {profile?.user_name}
                          </span>
                          <span className="text-muted-foreground text-xs md:text-sm truncate">
                            @{profile?.user_handle}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(comment.created_at).toLocaleDateString("he-IL")}
                          </span>
                        </div>
                        <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="media" className="mt-0">
              {media.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
                  אין מדיה עדיין
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square bg-muted cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                    >
                      {item.file_type === "video" ? (
                        <>
                          <video
                            src={item.file_url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                            0:06
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.file_url}
                          alt="Media"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-0">
              {likedPosts.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
                  אין לייקים עדיין
                </div>
              ) : (
                likedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    postId={post.id}
                    author={post.author_name}
                    handle={post.author_handle}
                    time={new Date(post.created_at).toLocaleDateString("he-IL")}
                    content={post.content}
                    image={post.image || undefined}
                    mediaType={post.media_type}
                    userId={post.user_id}
                    currentUserId={currentUser?.id}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <FloatingPostButton />
      <MobileNav />
    </>
  );
}
