import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BadgeCheck, Users } from "lucide-react";
import { toast } from "sonner";

interface SuggestedUser {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  score: number;
  mutualConnections: number;
}

interface SuggestedUsersProps {
  limit?: number;
  showHeader?: boolean;
  showMutualConnections?: boolean;
}

export default function SuggestedUsers({ 
  limit = 5, 
  showHeader = true,
  showMutualConnections = true 
}: SuggestedUsersProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSuggestions();
  }, [limit]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('suggest-users', {
        body: { limit }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
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

      // Track that user followed this suggestion (for machine learning)
      await supabase
        .from("suggestion_interactions")
        .insert({ 
          user_id: user.id, 
          suggested_user_id: userId, 
          interaction_type: 'followed' 
        });

      // Track A/B testing metric
      const { data: assignment } = await supabase
        .from('experiment_assignments')
        .select('experiment_id, variant_id')
        .eq('user_id', user.id)
        .single();

      if (assignment) {
        await supabase
          .from('experiment_metrics')
          .insert({
            experiment_id: assignment.experiment_id,
            variant_id: assignment.variant_id,
            user_id: user.id,
            metric_type: 'suggestion_followed',
            suggested_user_id: userId
          });
      }

      setFollowingStatus(prev => ({ ...prev, [userId]: true }));
      toast.success("עוקב");
      
      // Refresh suggestions after following
      setTimeout(fetchSuggestions, 1000);
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("שגיאה");
    }
  };


  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        {showHeader && <h2 className="text-lg font-bold mb-3">אנשים שאולי תכיר</h2>}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      {showHeader && (
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          אנשים שאולי תכיר
        </h2>
      )}
      <div className="space-y-3">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0 group">
            <Link to={`/profile/${user.user_handle}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback>{user.user_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${user.user_handle}`} className="hover:underline">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm truncate">{user.user_name}</p>
                  {user.is_verified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{user.user_handle}</p>
              </Link>
              {showMutualConnections && user.mutualConnections > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {user.mutualConnections} חיבורים משותפים
                </p>
              )}
              {user.bio && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {user.bio}
                </p>
              )}
            </div>
            <Button
              onClick={() => handleFollow(user.id)}
              disabled={followingStatus[user.id]}
              size="sm"
              variant={followingStatus[user.id] ? "outline" : "default"}
              className="rounded-full px-4 text-xs shrink-0"
            >
              {followingStatus[user.id] ? "עוקב" : "עקוב"}
            </Button>
          </div>
        ))}
      </div>
      {suggestions.length >= limit && (
        <Link to="/suggestions">
          <Button variant="ghost" className="w-full mt-3 text-primary hover:text-primary">
            הצג עוד המלצות
          </Button>
        </Link>
      )}
    </div>
  );
}
