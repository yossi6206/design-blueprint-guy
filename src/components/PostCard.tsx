import { MessageCircle, Repeat2, Heart, MoreHorizontal, Pencil, Trash2, TrendingUp, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  mediaType?: string | null;
  verified?: boolean;
  userId: string;
  currentUserId?: string;
  isBoosted?: boolean;
  initialLikesCount?: number;
  initialCommentsCount?: number;
  initialRetweetsCount?: number;
  initialBoostsCount?: number;
  showComments?: boolean;
}

export const PostCard = ({
  postId,
  author,
  handle,
  time,
  content,
  image,
  mediaType,
  verified = false,
  userId,
  currentUserId,
  isBoosted = false,
  initialLikesCount = 0,
  initialCommentsCount = 0,
  initialRetweetsCount = 0,
  initialBoostsCount = 0,
  showComments = false,
}: PostCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [retweetsCount, setRetweetsCount] = useState(initialRetweetsCount);
  const [boostsCount, setBoostsCount] = useState(initialBoostsCount);
  const [isBoostedByUser, setIsBoostedByUser] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [showRetweetDialog, setShowRetweetDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOwnPost = currentUserId === userId;

  useEffect(() => {
    fetchLikesAndComments();
    fetchUserAvatar();
    fetchRetweets();
    fetchBoosts();
    if (currentUserId && userId !== currentUserId) {
      checkIfFollowing();
    }
  }, [postId, currentUserId]);

  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}-updates`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes", filter: `post_id=eq.${postId}` },
        () => fetchLikesAndComments()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => fetchLikesAndComments()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "retweets", filter: `original_post_id=eq.${postId}` },
        () => fetchRetweets()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_boosts", filter: `post_id=eq.${postId}` },
        () => fetchBoosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

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

  const fetchBoosts = async () => {
    const { count: boostsCount } = await supabase
      .from("post_boosts")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    
    setBoostsCount(boostsCount || 0);

    if (currentUserId) {
      const { data: userBoost } = await supabase
        .from("post_boosts")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      
      setIsBoostedByUser(!!userBoost);
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

  const handleBoost = async () => {
    if (!currentUserId) {
      toast({ title: "התחבר כדי לקדם פוסט", variant: "destructive" });
      return;
    }

    if (isBoostedByUser) {
      const { error } = await supabase.from("post_boosts").delete().eq("post_id", postId).eq("user_id", currentUserId);
      if (!error) {
        setIsBoostedByUser(false);
        setBoostsCount((prev) => prev - 1);
        toast({ title: "הקידום בוטל בהצלחה" });
      }
    } else {
      const { error } = await supabase.from("post_boosts").insert({ post_id: postId, user_id: currentUserId });
      if (!error) {
        setIsBoostedByUser(true);
        setBoostsCount((prev) => prev + 1);
        toast({ title: "הפוסט קודם בהצלחה! 🚀" });
      }
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return <Link key={index} to={`/hashtag/${part.substring(1)}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{part}</Link>;
      } else if (part.startsWith('@')) {
        return <Link key={index} to={`/profile/${part.substring(1)}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{part}</Link>;
      }
      return part;
    });
  };

  return (
    <div className={`border-b border-border p-3 md:p-4 hover:bg-accent/5 transition-colors ${isBoosted ? "bg-primary/5" : ""}`}>
      {isBoosted && (
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <TrendingUp className="w-3 h-3 ml-1" />
            פוסט מקודם
          </Badge>
        </div>
      )}
      <div className="flex gap-2 md:gap-3">
        <Link to={`/profile/${handle}`} className="flex-shrink-0">
          <Avatar className="w-10 h-10 md:w-12 md:h-12">
            <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`} />
            <AvatarFallback>{author[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-1 justify-between">
            <div className="flex items-center gap-1 flex-wrap text-sm md:text-base">
              <Link to={`/profile/${handle}`} className="font-bold hover:underline">{author}</Link>
              {verified && <BadgeCheck className="h-3 w-3 md:h-4 md:w-4 text-background fill-primary" />}
              <Link to={`/profile/${handle}`} className="text-muted-foreground text-xs md:text-sm hover:underline">@{handle}</Link>
              <span className="text-muted-foreground text-xs md:text-sm">· {time}</span>
            </div>
            {userId !== currentUserId && currentUserId && (
              <Button variant={isFollowing ? "outline" : "default"} size="sm" onClick={handleFollow} className="rounded-full text-xs md:text-sm h-7 md:h-8 px-2 md:px-3">
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
          <div 
            onClick={() => navigate(`/post/${postId}`)}
            className="cursor-pointer transition-colors hover:bg-accent/10 rounded-lg p-2 -m-2"
          >
            <p className="mt-1 whitespace-pre-wrap text-sm md:text-base">{renderContent(content)}</p>
            {image && (
              <div className="mt-2 md:mt-3 rounded-2xl overflow-hidden border border-border">
                {mediaType === "video" ? (
                  <video
                    src={image}
                    controls
                    className="w-full max-h-[500px] object-cover"
                    playsInline
                  >
                    הדפדפן שלך לא תומך בתגית וידאו.
                  </video>
                ) : (
                  <img src={image} alt="Post" className="w-full" />
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2 md:mt-3 text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/post/${postId}`); }} className="h-8 px-2 md:px-3"><MessageCircle className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" /><span className="text-xs md:text-sm">{commentsCount}</span></Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setShowRetweetDialog(true); }} className={`h-8 px-2 md:px-3 ${isRetweeted ? "text-green-500" : ""}`}><Repeat2 className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" /><span className="text-xs md:text-sm">{retweetsCount}</span></Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLike(); }} className={`h-8 px-2 md:px-3 ${isLiked ? "text-pink-500" : ""}`}><Heart className={`h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2 ${isLiked ? "fill-current" : ""}`} /><span className="text-xs md:text-sm">{likesCount}</span></Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleBoost(); }} className={`h-8 px-2 md:px-3 ${isBoostedByUser ? "text-primary" : ""}`}><TrendingUp className={`h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2 ${isBoostedByUser ? "fill-current" : ""}`} /><span className="text-xs md:text-sm">{boostsCount}</span></Button>
            <BookmarkButton postId={postId} currentUserId={currentUserId} />
          </div>
          {showComments && (
            <Comments 
              postId={postId} 
              currentUserId={currentUserId} 
              onCommentAdded={() => setCommentsCount((prev) => prev + 1)} 
              previewMode={!showAllComments}
              onShowMore={() => setShowAllComments(true)}
            />
          )}
        </div>
      </div>
      <RetweetDialog open={showRetweetDialog} onOpenChange={setShowRetweetDialog} postId={postId} originalAuthor={author} originalContent={content} onSuccess={() => fetchRetweets()} />
      <EditPostDialog open={showEditDialog} onOpenChange={setShowEditDialog} postId={postId} currentContent={content} currentImage={image} onSuccess={() => window.location.reload()} />
      <DeletePostDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} postId={postId} onSuccess={() => window.location.reload()} />
    </div>
  );
};