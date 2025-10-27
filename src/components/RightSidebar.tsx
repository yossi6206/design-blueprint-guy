import { Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const newsItems = [
  {
    category: "Politics · Trending",
    title: "Mossad",
    posts: "24.9K posts",
  },
  {
    category: "Trending in Israel",
    title: "של נגיד",
    posts: "",
  },
];

const trending = [
  {
    title: "Mamdani Rallies 10,000 in Queens with Sanders, AOC, and Hochul Endorsements",
    category: "News",
    time: "11 hours ago",
    posts: "176.2K posts",
  },
  {
    title: "Austin Reaves Drops Career-High 51 Points in Lakers' Victory Over Kings",
    category: "Sports",
    time: "8 hours ago",
    posts: "75.6K posts",
  },
  {
    title: "Lando Norris Wins Mexico GP, Leads F1 Drivers' Championship by One Point Over...",
    category: "Sports",
    time: "2 days ago",
    posts: "274.3K posts",
  },
];

export const RightSidebar = () => {
  return (
    <div className="w-[350px] h-screen sticky top-0 px-6 py-2">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-14 pr-4 py-3 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Subscribe */}
      <div className="bg-muted rounded-2xl p-4 mb-4">
        <h2 className="text-xl font-bold mb-2">Subscribe to Premium</h2>
        <p className="text-sm mb-3">
          Subscribe to unlock new features and if eligible, receive a share of ads revenue.
        </p>
        <Button className="rounded-full font-bold bg-primary hover:bg-hover-primary">
          Subscribe
        </Button>
      </div>

      {/* Today's News */}
      <div className="bg-muted rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Today's News</h2>
          <button>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {trending.map((item, i) => (
            <div key={i} className="hover:bg-hover-bg -mx-4 px-4 py-2 rounded-lg transition-colors cursor-pointer">
              <div className="flex gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.category}</span>
                  <span>·</span>
                  <span>{item.time}</span>
                </div>
              </div>
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.posts}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What's happening */}
      <div className="bg-muted rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">What's happening</h2>
        <div className="space-y-4">
          <div className="text-right mb-2">
            <span className="text-lg font-bold">תרמיל קליין</span>
          </div>
          {newsItems.map((item, i) => (
            <div key={i} className="hover:bg-hover-bg -mx-4 px-4 py-2 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                  <h3 className="font-bold">{item.title}</h3>
                  {item.posts && (
                    <p className="text-xs text-muted-foreground mt-1">{item.posts}</p>
                  )}
                </div>
                <button>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button className="text-primary hover:underline text-sm">Show more</button>
        </div>
      </div>
    </div>
  );
};
