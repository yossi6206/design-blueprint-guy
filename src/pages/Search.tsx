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
    const q = searchParams.get("q") || "";
    setQuery(q);
    if (q.trim()) {
      searchContent(q);
    } else {
      setUsers([]);
      setPosts([]);
    }
  }, [searchParams]);

  const searchContent = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    // Search users - using separate queries to avoid parsing issues
    const { data: usersByName } = await supabase
      .from("profiles")
      .select("*")
      .ilike("user_name", `%${searchQuery}%`)
      .limit(20);

    const { data: usersByHandle } = await supabase
      .from("profiles")
      .select("*")
      .ilike("user_handle", `%${searchQuery}%`)
      .limit(20);

    // Combine and deduplicate users
    const allUsers = [...(usersByName || []), ...(usersByHandle || [])];
    const uniqueUsers = Array.from(
      new Map(allUsers.map(user => [user.id, user])).values()
    ).slice(0, 20);

    setUsers(uniqueUsers);

    // Search posts
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .ilike("content", `%${searchQuery}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    setPosts(postsData || []);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-search while typing (with debounce effect)
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    } else {
      navigate('/search');
      setUsers([]);
      setPosts([]);
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
                <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="חיפוש"
                  value={query}
                  onChange={handleInputChange}
                  className="pr-12 text-base h-12 bg-muted/30 border-muted hover:bg-muted/50 focus:bg-background transition-colors"
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
              {users.length > 0 || posts.length > 0 ? (
                <>
                  {users.length > 0 && (
                    <div className="border-b border-border">
                      <div className="p-4 text-base font-semibold">משתמשים</div>
                      {users.slice(0, 3).map((user) => (
                        <Link
                          key={user.id}
                          to={`/profile/${user.user_handle}`}
                          className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-all border-b border-border"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground">
                              {user.user_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-base font-semibold truncate">{user.user_name}</span>
                              {user.is_verified && (
                                <BadgeCheck className="h-4 w-4 text-background fill-primary shrink-0" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">@{user.user_handle}</div>
                            {user.bio && <div className="text-sm mt-1 line-clamp-2 text-foreground/80">{user.bio}</div>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {posts.length > 0 && (
                    <div>
                      {users.length > 0 && <div className="p-4 text-base font-semibold">פוסטים</div>}
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
                    </div>
                  )}
                </>
              ) : query ? (
                <div className="p-8 text-center text-muted-foreground">
                  לא נמצאו תוצאות עבור "{query}"
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  חפש משתמשים ופוסטים
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              {users.length > 0 ? (
                users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.user_handle}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-all border-b border-border"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground">
                        {user.user_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-semibold truncate">{user.user_name}</span>
                        {user.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-background fill-primary shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">@{user.user_handle}</div>
                      {user.bio && <div className="text-sm mt-1 line-clamp-2 text-foreground/80">{user.bio}</div>}
                    </div>
                  </Link>
                ))
              ) : query ? (
                <div className="p-8 text-center text-muted-foreground">
                  לא נמצאו משתמשים עבור "{query}"
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  חפש משתמשים לפי שם או כינוי
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="mt-0">
              {posts.length > 0 ? (
                posts.map((post) => (
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
                ))
              ) : query ? (
                <div className="p-8 text-center text-muted-foreground">
                  לא נמצאו פוסטים עבור "{query}"
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  חפש פוסטים לפי תוכן
                </div>
              )}
            </TabsContent>
          </Tabs>
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