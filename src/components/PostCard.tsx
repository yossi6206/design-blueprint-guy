import { MessageCircle, Repeat2, Heart, BarChart3, Share, MoreHorizontal } from "lucide-react";

interface PostCardProps {
  author: string;
  handle: string;
  time: string;
  content: string;
  image?: string;
  verified?: boolean;
  comments?: number;
  retweets?: number;
  likes?: number;
  views?: number;
}

export const PostCard = ({
  author,
  handle,
  time,
  content,
  image,
  verified = false,
  comments = 0,
  retweets = 0,
  likes = 0,
  views = 0,
}: PostCardProps) => {
  return (
    <div className="border-b border-border px-4 py-3 hover:bg-hover-bg transition-colors cursor-pointer">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 mb-1">
            <span className="font-bold hover:underline">{author}</span>
            {verified && (
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary fill-current">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
              </svg>
            )}
            <span className="text-muted-foreground">@{handle} · {time}</span>
            <div className="ml-auto">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </div>
          </div>

          {/* Content */}
          <p className="mb-3 whitespace-pre-wrap">{content}</p>

          {/* Image */}
          {image && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-border">
              <img src={image} alt="" className="w-full" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md text-muted-foreground">
            <button className="flex items-center gap-2 hover:text-primary group">
              <div className="rounded-full p-2 group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              {comments > 0 && <span className="text-sm">{comments}</span>}
            </button>

            <button className="flex items-center gap-2 hover:text-green-500 group">
              <div className="rounded-full p-2 group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
              {retweets > 0 && <span className="text-sm">{retweets}</span>}
            </button>

            <button className="flex items-center gap-2 hover:text-pink-600 group">
              <div className="rounded-full p-2 group-hover:bg-pink-600/10 transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              {likes > 0 && <span className="text-sm">{likes.toLocaleString()}</span>}
            </button>

            <button className="flex items-center gap-2 hover:text-primary group">
              <div className="rounded-full p-2 group-hover:bg-primary/10 transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              {views > 0 && <span className="text-sm">{views.toLocaleString()}</span>}
            </button>

            <button className="hover:text-primary group">
              <div className="rounded-full p-2 group-hover:bg-primary/10 transition-colors">
                <Share className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
