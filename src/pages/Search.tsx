import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
}

interface Post {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  image?: string;
  created_at: string;
  user_id: string;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (query) {
      searchContent();
    }
  }, [query]);

  const searchContent = async () => {
    // Search users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .or(`user_name.ilike.%${query}%,user_handle.ilike.%${query}%`)
      .limit(20);

    setUsers(usersData || []);

    // Search posts
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    setPosts(postsData || []);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-background justify-center">
      <Sidebar />
      
      <main className="flex-1 max-w-[600px] border-x border-border">
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b border-border">
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <SearchIcon className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="חפש משתמשים, פוסטים, hashtags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </form>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger value="all" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              הכל
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              משתמשים
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              פוסטים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {users.length > 0 && (
              <div className="border-b border-border">
                <div className="p-4 font-semibold">משתמשים</div>
                {users.slice(0, 3).map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.user_handle}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b border-border"
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback>{user.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{user.user_name}</span>
                        {user.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-background fill-primary shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">@{user.user_handle}</div>
                      {user.bio && <div className="text-sm mt-1">{user.bio}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {posts.slice(0, 5).map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                author={post.author_name}
                handle={post.author_handle}
                time={post.created_at}
                content={post.content}
                image={post.image}
                userId={post.user_id}
                currentUserId={currentUserId}
              />
            ))}
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.user_handle}`}
                className="flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b border-border"
              >
                <Avatar>
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback>{user.user_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{user.user_name}</span>
                    {user.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-background fill-primary shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">@{user.user_handle}</div>
                  {user.bio && <div className="text-sm mt-1">{user.bio}</div>}
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="posts" className="mt-0">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                author={post.author_name}
                handle={post.author_handle}
                time={post.created_at}
                content={post.content}
                image={post.image}
                userId={post.user_id}
                currentUserId={currentUserId}
              />
            ))}
          </TabsContent>
        </Tabs>

        {query && users.length === 0 && posts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            לא נמצאו תוצאות עבור "{query}"
          </div>
        )}
      </main>

      <RightSidebar />
    </div>
  );
}