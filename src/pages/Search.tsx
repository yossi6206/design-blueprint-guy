import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { FloatingPostButton } from "@/components/FloatingPostButton";
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
  media_type?: string | null;
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
    <>
      <div className="flex min-h-screen bg-background justify-center pb-16 md:pb-0">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 max-w-[600px] md:border-x border-border">
          <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b border-border">
            <form onSubmit={handleSearch} className="p-3 md:p-4">
              <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="חפש משתמשים, פוסטים..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pr-9 md:pr-10 text-sm md:text-base h-9 md:h-10"
                />
              </div>
            </form>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
              <TabsTrigger value="all" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-sm md:text-base py-3">
                הכל
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-sm md:text-base py-3">
                משתמשים
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-sm md:text-base py-3">
                פוסטים
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {users.length > 0 && (
                <div className="border-b border-border">
                  <div className="p-3 md:p-4 text-sm md:text-base font-semibold">משתמשים</div>
                  {users.slice(0, 3).map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.user_handle}`}
                      className="flex items-center gap-2 md:gap-3 p-3 md:p-4 hover:bg-accent transition-colors border-b border-border"
                    >
                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{user.user_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm md:text-base font-semibold truncate">{user.user_name}</span>
                          {user.is_verified && (
                            <BadgeCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-background fill-primary shrink-0" />
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">@{user.user_handle}</div>
                        {user.bio && <div className="text-xs md:text-sm mt-1 line-clamp-2">{user.bio}</div>}
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
                  mediaType={post.media_type}
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
                  className="flex items-center gap-2 md:gap-3 p-3 md:p-4 hover:bg-accent transition-colors border-b border-border"
                >
                  <Avatar className="h-10 w-10 md:h-12 md:w-12">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm md:text-base font-semibold truncate">{user.user_name}</span>
                      {user.is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-background fill-primary shrink-0" />
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground truncate">@{user.user_handle}</div>
                    {user.bio && <div className="text-xs md:text-sm mt-1 line-clamp-2">{user.bio}</div>}
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
                  mediaType={post.media_type}
                  userId={post.user_id}
                  currentUserId={currentUserId}
                />
              ))}
            </TabsContent>
          </Tabs>

          {query && users.length === 0 && posts.length === 0 && (
            <div className="p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
              לא נמצאו תוצאות עבור "{query}"
            </div>
          )}
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <FloatingPostButton />
      <MobileNav />
    </>
  );
}