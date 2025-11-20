import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BadgeCheck, Users, X } from "lucide-react";
import { toast } from "sonner";

interface SuggestedUser {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  is_verified: boolean;
  score: number;
  mutualConnections: number;
}

export default function Suggestions() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('suggest-users', {
        body: { limit: 30 }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error("שגיאה בטעינת ההמלצות");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("יש להתחבר כדי לעקוב");
        return;
      }

      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: userId });

      // Track that user followed this suggestion
      await supabase
        .from("suggestion_interactions")
        .insert({ 
          user_id: user.id, 
          suggested_user_id: userId, 
          interaction_type: 'followed' 
        });

      setFollowingStatus(prev => ({ ...prev, [userId]: true }));
      toast.success("עוקב");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("שגיאה");
    }
  };

  const handleDismiss = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Track that user dismissed this suggestion
      await supabase
        .from("suggestion_interactions")
        .insert({ 
          user_id: user.id, 
          suggested_user_id: userId, 
          interaction_type: 'dismissed' 
        });

      // Remove from current suggestions
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      toast.success("הוסר מההמלצות");
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">טוען המלצות...</p>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <h1 className="text-xl font-bold">אנשים שאולי תכיר</h1>
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="divide-y divide-border">
          {suggestions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>אין המלצות כרגע</p>
            </div>
          ) : (
            suggestions.map((user) => (
              <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <Link to={`/profile/${user.user_handle}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback>{user.user_name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/profile/${user.user_handle}`} className="hover:underline flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-sm truncate">{user.user_name}</h3>
                          {user.is_verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.user_handle}</p>
                      </Link>
                      <Button
                        onClick={() => handleDismiss(user.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {user.mutualConnections > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.mutualConnections} חיבורים משותפים
                      </p>
                    )}
                    
                    {user.bio && (
                      <p className="text-sm mt-2 line-clamp-3">{user.bio}</p>
                    )}
                    
                    {user.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {user.location}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleFollow(user.id)}
                    disabled={followingStatus[user.id]}
                    variant={followingStatus[user.id] ? "outline" : "default"}
                    size="sm"
                    className="rounded-full px-4 shrink-0"
                  >
                    {followingStatus[user.id] ? "עוקב" : "עקוב"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
