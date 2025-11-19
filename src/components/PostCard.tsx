import { MessageCircle, Repeat2, Heart, BarChart3, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Comments } from "./Comments";

interface PostCardProps {
  postId: string;
  author: string;
  handle: string;
  time: string;
  content: string;
  image?: string;
  verified?: boolean;
  userId: string;
  currentUserId?: string;
}

export const PostCard = ({
  postId,
  author,
  handle,
  time,
  content,
  image,
  verified = false,
  userId,
  currentUserId,
}: PostCardProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchLikesAndComments();
    if (currentUserId && userId !== currentUserId) {
      checkIfFollowing();
    }
  }, [postId, currentUserId]);

  const fetchLikesAndComments = async () => {
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    
    setLikesCount(likesCount || 0);

    if (currentUserId) {
      const { data: userLike } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      
      setIsLiked(!!userLike);
    }

    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    
    setCommentsCount(commentsCount || 0);
  };

  const checkIfFollowing = async () => {
    if (!currentUserId) return;
    
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", userId)
      .maybeSingle();
    
    setIsFollowing(!!data);
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "התחבר כדי לתת לייק",
        variant: "destructive",
      });
      return;
    }

    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);

      if (!error) {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: currentUserId });

      if (!error) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: "התחבר כדי לעקוב",
        variant: "destructive",
      });
      return;
    }

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      if (!error) {
        setIsFollowing(false);
        toast({ title: "הפסקת לעקוב" });
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: userId });

      if (!error) {
        setIsFollowing(true);
        toast({ title: "עוקב!" });
      }
    }
  };

  const handleShare = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    toast({
      title: "הקישור הועתק!",
    });
  };

  return (
    <div className="border-b border-border p-4 hover:bg-accent/5 transition-colors">
      <div className="flex gap-3">
        <Link to={`/profile/${handle}`}>
          <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`} />
            <AvatarFallback>{author[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <Link to={`/profile/${handle}`}>
              <span className="font-bold hover:underline cursor-pointer">{author}</span>
            </Link>
            {verified && <Badge variant="secondary" className="h-4 w-4 p-0">✓</Badge>}
            <span className="text-muted-foreground">@{handle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{time}</span>
            {currentUserId && userId !== currentUserId && (
              <>
                <span className="text-muted-foreground">·</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFollow}
                  className="h-auto p-0 text-primary hover:text-primary/80"
                >
                  {isFollowing ? "עוקב" : "עקוב"}
                </Button>
              </>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words">{content}</p>
          {image && (
            <img
              src={image}
              alt="Post content"
              className="mt-3 rounded-2xl max-w-full border border-border"
            />
          )}
          <div className="flex justify-between mt-3 max-w-md text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-blue-500 hover:bg-blue-500/10"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="ml-2">{commentsCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-green-500 hover:bg-green-500/10">
              <Repeat2 className="w-5 h-5" />
              <span className="ml-2">0</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`hover:text-pink-500 hover:bg-pink-500/10 ${
                isLiked ? "text-pink-500" : ""
              }`}
              onClick={handleLike}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              <span className="ml-2">{likesCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-blue-500 hover:bg-blue-500/10">
              <BarChart3 className="w-5 h-5" />
              <span className="ml-2">0</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-blue-500 hover:bg-blue-500/10"
              onClick={handleShare}
            >
              <Share className="w-5 h-5" />
            </Button>
          </div>
          {showComments && (
            <Comments
              postId={postId}
              currentUserId={currentUserId}
              onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
