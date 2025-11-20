import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  bio: string | null;
  avatar_url: string | null;
}

interface UserWithFollowStatus extends Profile {
  isFollowing: boolean;
}

export default function Followers() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "followers";
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followers, setFollowers] = useState<UserWithFollowStatus[]>([]);
  const [following, setFollowing] = useState<UserWithFollowStatus[]>([]);
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
    const fetchData = async () => {
      if (!handle) return;

      try {
        // Fetch profile
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

        // Fetch followers
        const { data: followersData, error: followersError } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", profileData.id);

        if (followersError) throw followersError;

        const followerIds = followersData?.map((f) => f.follower_id) || [];
        if (followerIds.length > 0) {
          const { data: followerProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", followerIds);

          if (followerProfiles && currentUser) {
            const { data: currentUserFollows } = await supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", currentUser.id);

            const followingIds = currentUserFollows?.map((f) => f.following_id) || [];
            
            setFollowers(
              followerProfiles.map((profile) => ({
                ...profile,
                isFollowing: followingIds.includes(profile.id),
              }))
            );
          }
        }

        // Fetch following
        const { data: followingData, error: followingError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", profileData.id);

        if (followingError) throw followingError;

        const followingIds = followingData?.map((f) => f.following_id) || [];
        if (followingIds.length > 0) {
          const { data: followingProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", followingIds);

          if (followingProfiles && currentUser) {
            const { data: currentUserFollows } = await supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", currentUser.id);

            const currentUserFollowingIds = currentUserFollows?.map((f) => f.following_id) || [];
            
            setFollowing(
              followingProfiles.map((profile) => ({
                ...profile,
                isFollowing: currentUserFollowingIds.includes(profile.id),
              }))
            );
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [handle, currentUser, navigate]);

  const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) {
      toast.error("יש להתחבר כדי לעקוב");
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId);
        
        setFollowers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, isFollowing: false } : user
          )
        );
        setFollowing((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, isFollowing: false } : user
          )
        );
        toast.success("הפסקת לעקוב");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: userId });
        
        setFollowers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, isFollowing: true } : user
          )
        );
        setFollowing((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, isFollowing: true } : user
          )
        );
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

  if (!profile) return null;

  const UserItem = ({ user }: { user: UserWithFollowStatus }) => (
    <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border">
      <Link to={`/profile/${user.user_handle}`}>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url || ""} />
          <AvatarFallback>{user.user_name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.user_handle}`} className="hover:underline">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-sm truncate">{user.user_name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">@{user.user_handle}</p>
        </Link>
        {user.bio && (
          <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
        )}
      </div>
      {currentUser?.id !== user.id && (
        <Button
          onClick={() => handleFollow(user.id, user.isFollowing)}
          variant={user.isFollowing ? "outline" : "default"}
          size="sm"
          className="rounded-full px-4 shrink-0"
        >
          {user.isFollowing ? "עוקב" : "עקוב"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background justify-center">
      <div className="w-full max-w-2xl border-x border-border">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/profile/${handle}`)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{profile.user_name}</h1>
              <p className="text-sm text-muted-foreground">@{profile.user_handle}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-around rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="followers"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              עוקבים
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              עוקב
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-0">
            {followers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                אין עוקבים עדיין
              </div>
            ) : (
              followers.map((user) => <UserItem key={user.id} user={user} />)
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {following.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                לא עוקב אחרי אף אחד עדיין
              </div>
            ) : (
              following.map((user) => <UserItem key={user.id} user={user} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
