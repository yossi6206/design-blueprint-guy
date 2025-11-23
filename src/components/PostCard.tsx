import { MessageCircle, Repeat2, Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Comments } from "./Comments";
import { BookmarkButton } from "./BookmarkButton";
import { RetweetDialog } from "./RetweetDialog";
import { EditPostDialog } from "./EditPostDialog";
import { DeletePostDialog } from "./DeletePostDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [retweetsCount, setRetweetsCount] = useState(0);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [showRetweetDialog, setShowRetweetDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOwnPost = currentUserId === userId;

  useEffect(() => {
    fetchLikesAndComments();
    fetchUserAvatar();
    fetchRetweets();
    if (currentUserId && userId !== currentUserId) {
      checkIfFollowing();
    }
  }, [postId, currentUserId]);

  const fetchUserAvatar = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();
    
    if (profile) {
      setAvatarUrl(profile.avatar_url);
    }
  };

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

  const fetchRetweets = async () => {
    const { count: retweetsCount } = await supabase
      .from("retweets")
      .select("*", { count: "exact", head: true })
      .eq("original_post_id", postId);
    
    setRetweetsCount(retweetsCount || 0);

    if (currentUserId) {
      const { data: userRetweet } = await supabase
        .from("retweets")
        .select("id")
        .eq("original_post_id", postId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      
      setIsRetweeted(!!userRetweet);
    }
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
      toast({ title: "התחבר כדי לתת לייק", variant: "destructive" });
      return;
    }

    if (isLiked) {
      const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
      if (!error) {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId });
      if (!error) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast({ title: "התחבר כדי לעקוב", variant: "destructive" });
      return;
    }

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
      setIsFollowing(true);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return <Link key={index} to={`/hashtag/${part.substring(1)}`} className="text-primary hover:underline">{part}</Link>;
      } else if (part.startsWith('@')) {
        return <Link key={index} to={`/profile/${part.substring(1)}`} className="text-primary hover:underline">{part}</Link>;
      }
      return part;
    });
  };

  return (
    <div className="border-b border-border p-4 hover:bg-accent/5 transition-colors">
      <div className="flex gap-3">
        <Link to={`/profile/${handle}`} className="flex-shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`} />
            <AvatarFallback>{author[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-1 justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <Link to={`/profile/${handle}`}><span className="font-bold hover:underline">{author}</span></Link>
              {verified && <Badge variant="secondary" className="h-4 w-4 p-0">✓</Badge>}
              <span className="text-muted-foreground">@{handle} · {time}</span>
            </div>
            {userId !== currentUserId && currentUserId && (
              <Button variant={isFollowing ? "outline" : "default"} size="sm" onClick={handleFollow} className="rounded-full">
                {isFollowing ? "עוקב" : "עקוב"}
              </Button>
            )}
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}><Pencil className="h-4 w-4 ml-2" />ערוך</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive"><Trash2 className="h-4 w-4 ml-2" />מחק</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap">{renderContent(content)}</p>
          {image && <img src={image} alt="Post" className="mt-3 rounded-2xl max-w-full border border-border" />}
          <div className="flex justify-between mt-3 text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}><MessageCircle className="h-5 w-5 ml-2" /><span>{commentsCount}</span></Button>
            <Button variant="ghost" size="sm" onClick={() => setShowRetweetDialog(true)} className={isRetweeted ? "text-green-500" : ""}><Repeat2 className="h-5 w-5 ml-2" /><span>{retweetsCount}</span></Button>
            <Button variant="ghost" size="sm" onClick={handleLike} className={isLiked ? "text-pink-500" : ""}><Heart className={`h-5 w-5 ml-2 ${isLiked ? "fill-current" : ""}`} /><span>{likesCount}</span></Button>
            <BookmarkButton postId={postId} currentUserId={currentUserId} />
          </div>
          {showComments && <Comments postId={postId} currentUserId={currentUserId} onCommentAdded={() => setCommentsCount((prev) => prev + 1)} />}
        </div>
      </div>
      <RetweetDialog open={showRetweetDialog} onOpenChange={setShowRetweetDialog} postId={postId} originalAuthor={author} originalContent={content} onSuccess={() => fetchRetweets()} />
      <EditPostDialog open={showEditDialog} onOpenChange={setShowEditDialog} postId={postId} currentContent={content} currentImage={image} onSuccess={() => window.location.reload()} />
      <DeletePostDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} postId={postId} onSuccess={() => window.location.reload()} />
    </div>
  );
};