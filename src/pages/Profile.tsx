import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Link2, MapPin, Calendar, MoreHorizontal } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { EditProfileDialog } from "@/components/EditProfileDialog";
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
}

interface Post {
  id: string;
  content: string;
  image: string | null;
  created_at: string;
  author_name: string;
  author_handle: string;
  user_id: string;
}

export default function Profile() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
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
    <div className="flex min-h-screen bg-background justify-center">
      <div className="w-full max-w-2xl border-x border-border">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{profile.user_name}</h1>
              <p className="text-sm text-muted-foreground">{posts.length} פוסטים</p>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="h-48 bg-muted">
          {profile.cover_image && (
            <img
              src={profile.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-start -mt-16 mb-4">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarFallback className="text-4xl">
                {profile.user_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="mt-16 flex gap-2">
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
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
                  className="rounded-full px-6"
                >
                  {isFollowing ? "עוקב" : "עקוב"}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold">{profile.user_name}</h2>
              <p className="text-muted-foreground">@{profile.user_handle}</p>
            </div>

            {profile.bio && <p className="text-sm">{profile.bio}</p>}

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>הצטרף {joinDate}</span>
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <button className="hover:underline">
                <span className="font-bold">{followingCount}</span>{" "}
                <span className="text-muted-foreground">עוקב</span>
              </button>
              <button className="hover:underline">
                <span className="font-bold">{followersCount}</span>{" "}
                <span className="text-muted-foreground">עוקבים</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-around rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="posts"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              פוסטים
            </TabsTrigger>
            <TabsTrigger
              value="replies"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              תגובות
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              מדיה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
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
                  userId={post.user_id}
                  currentUserId={currentUser?.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-0">
            <div className="p-8 text-center text-muted-foreground">
              אין תגובות עדיין
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            <div className="p-8 text-center text-muted-foreground">
              אין מדיה עדיין
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
