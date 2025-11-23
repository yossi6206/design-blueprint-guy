import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_handle: string;
  created_at: string;
  user_id: string;
  avatar_url?: string;
  parent_comment_id?: string | null;
  replies?: Comment[];
  likes_count?: number;
  user_has_liked?: boolean;
}

interface CommentsProps {
  postId: string;
  currentUserId?: string;
  onCommentAdded?: () => void;
}

export const Comments = ({ postId, currentUserId, onCommentAdded }: CommentsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userHandle, setUserHandle] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string>("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchComments();
    if (currentUserId) {
      fetchUserInfo();
    }

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, currentUserId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // שליפת אווטארים לכל המשתמשים
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", userIds);

      const avatarMap = new Map(profiles?.map(p => [p.id, p.avatar_url]) || []);
      
      // שליפת likes לכל התגובות
      const commentIds = data.map(c => c.id);
      const { data: likesData } = await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);
      
      // מיפוי של likes
      const likesCountMap = new Map<string, number>();
      const userLikesSet = new Set<string>();
      
      likesData?.forEach(like => {
        likesCountMap.set(like.comment_id, (likesCountMap.get(like.comment_id) || 0) + 1);
        if (like.user_id === currentUserId) {
          userLikesSet.add(like.comment_id);
        }
      });
      
      const commentsWithAvatars = data.map(comment => ({
        ...comment,
        avatar_url: avatarMap.get(comment.user_id) || null,
        likes_count: likesCountMap.get(comment.id) || 0,
        user_has_liked: userLikesSet.has(comment.id)
      }));
      
      // Build threaded structure
      const topLevelComments = commentsWithAvatars.filter(c => !c.parent_comment_id);
      const repliesMap = new Map<string, Comment[]>();
      
      commentsWithAvatars.forEach(comment => {
        if (comment.parent_comment_id) {
          const replies = repliesMap.get(comment.parent_comment_id) || [];
          replies.push(comment);
          repliesMap.set(comment.parent_comment_id, replies);
        }
      });
      
      const attachReplies = (comment: Comment): Comment => {
        const replies = repliesMap.get(comment.id) || [];
        return {
          ...comment,
          replies: replies.map(attachReplies).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        };
      };
      
      setComments(topLevelComments.map(attachReplies));
    }
  };

  const fetchUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserName(user.user_metadata?.name || "משתמש");
      setUserHandle(user.user_metadata?.handle || user.email?.split("@")[0] || "user");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) {
      toast({
        title: "התחבר כדי להגיב",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "התגובה ריקה",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: newComment,
      author_name: userName,
      author_handle: userHandle,
      parent_comment_id: replyingTo,
    });

    if (error) {
      toast({
        title: "שגיאה בשליחת התגובה",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewComment("");
      setReplyingTo(null);
      setReplyingToName("");
      if (onCommentAdded) {
        onCommentAdded();
      }
      toast({
        title: replyingTo ? "התגובה נוספה לשרשור!" : "התגובה נוספה!",
      });
    }

    setLoading(false);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}ש`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}ד`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}ש`;
    return `${Math.floor(diffInSeconds / 86400)}י`;
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תגובה זו?")) {
      return;
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast({
        title: "שגיאה במחיקת התגובה",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "התגובה נמחקה בהצלחה",
      });
      fetchComments();
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!currentUserId) {
      toast({
        title: "התחבר כדי להצביע",
        variant: "destructive",
      });
      return;
    }

    if (currentlyLiked) {
      // Remove like
      const { error } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUserId);

      if (error) {
        toast({
          title: "שגיאה בהסרת ההצבעה",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      // Add like
      const { error } = await supabase
        .from("comment_likes")
        .insert({
          comment_id: commentId,
          user_id: currentUserId,
        });

      if (error) {
        toast({
          title: "שגיאה בהוספת הצבעה",
          description: error.message,
          variant: "destructive",
        });
      }
    }

    fetchComments();
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <div key={comment.id} className={depth > 0 ? "mr-8 relative" : ""}>
        {depth > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-border" />
        )}
        <div className={`flex gap-2 p-3 rounded-lg ${depth > 0 ? 'bg-accent/10' : 'bg-accent/20'}`}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage
              src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author_handle}`}
            />
            <AvatarFallback>{comment.author_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{comment.author_name}</span>
                <span className="text-muted-foreground text-sm">@{comment.author_handle}</span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">
                  {getTimeAgo(comment.created_at)}
                </span>
              </div>
              {currentUserId === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  ✕
                </Button>
              )}
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs gap-1 ${comment.user_has_liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
                onClick={() => handleLikeComment(comment.id, comment.user_has_liked || false)}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                {comment.likes_count ? comment.likes_count : ''}
              </Button>
              {currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setReplyingToName(comment.author_name);
                  }}
                >
                  הגב
                </Button>
              )}
              {hasReplies && depth === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {isExpanded ? "הסתר" : "הצג"} {comment.replies!.length} {comment.replies!.length === 1 ? "תגובה" : "תגובות"}
                </Button>
              )}
            </div>
          </div>
        </div>
        {hasReplies && (isExpanded || depth > 0) && (
          <div className="mt-2 space-y-2">
            {comment.replies!.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-4">
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/20 p-2 rounded">
              <span>מגיב ל-{replyingToName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-2"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyingToName("");
                }}
              >
                ✕
              </Button>
            </div>
          )}
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `תגובה ל-${replyingToName}...` : "כתוב תגובה..."}
            className="min-h-[80px] resize-none"
            disabled={loading}
            maxLength={280}
          />
          <div className="flex justify-between items-center">
            <span className={`text-sm ${newComment.length > 260 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {newComment.length}/280
            </span>
            <Button type="submit" disabled={loading || !newComment.trim() || newComment.length > 280}>
              {loading ? "שולח..." : "הגב"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {comments.map((comment) => renderComment(comment, 0))}
      </div>
    </div>
  );
};
