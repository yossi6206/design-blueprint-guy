import { PostCard } from "./PostCard";

const posts = [
  {
    author: "Amir Ohana - אמיר אוחנה",
    handle: "AmirOhana",
    time: "6h",
    content: "Congratulations, President @Milei, on winning the midterm election in a landslide! You are Making Argentina Great Again, and the people want more of it. VLLC!",
    verified: true,
    image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&h=400&fit=crop",
    comments: 61,
    retweets: 172,
    likes: 1600,
    views: 29000,
  },
  {
    author: "Tommy Robinson 🇬🇧",
    handle: "TRobinsonNewEra",
    time: "18h",
    content: "I'm tall in Israel",
    verified: true,
    comments: 1000,
    retweets: 252,
    likes: 5600,
    views: 445000,
  },
  {
    author: "Elon Musk",
    handle: "elonmusk",
    time: "17h",
    content: "Suicidal empathy is killing Western Civilization.\n\nIt is good to have empathy, but we cannot allow our empathy to be abused to the point of extinction!",
    verified: true,
    comments: 2400,
    retweets: 8300,
    likes: 42000,
    views: 1200000,
  },
];

export const Feed = () => {
  return (
    <div className="flex-1 border-r border-border max-w-[600px]">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex">
          <button className="flex-1 py-4 hover:bg-hover-bg transition-colors relative">
            <span className="font-bold">For you</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />
          </button>
          <button className="flex-1 py-4 hover:bg-hover-bg transition-colors text-muted-foreground">
            <span>Following</span>
          </button>
        </div>
      </div>

      {/* Posts */}
      <div>
        {posts.map((post, i) => (
          <PostCard key={i} {...post} />
        ))}
      </div>
    </div>
  );
};
