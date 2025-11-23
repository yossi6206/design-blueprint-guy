import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Stats {
  totalVerificationRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  verifiedUsers: number;
  totalUsers: number;
  trendingHashtags: Array<{
    tag: string;
    post_count: number;
    recent_post_count: number;
  }>;
  recentActivity: Array<{
    type: string;
    count: number;
  }>;
}

export function StatisticsOverview() {
  const [stats, setStats] = useState<Stats>({
    totalVerificationRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    verifiedUsers: 0,
    totalUsers: 0,
    trendingHashtags: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch verification stats
      const { data: verificationData } = await supabase
        .from("verification_requests")
        .select("status");

      const pending = verificationData?.filter(v => v.status === "pending").length || 0;
      const approved = verificationData?.filter(v => v.status === "approved").length || 0;
      const rejected = verificationData?.filter(v => v.status === "rejected").length || 0;

      // Fetch verified users count
      const { count: verifiedCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true);

      // Fetch total users
      const { count: totalUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch trending hashtags
      const { data: trendingData } = await supabase
        .from("trending_hashtags_view")
        .select("*")
        .order("recent_post_count", { ascending: false })
        .limit(5);

      setStats({
        totalVerificationRequests: verificationData?.length || 0,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        verifiedUsers: verifiedCount || 0,
        totalUsers: totalUsersCount || 0,
        trendingHashtags: trendingData || [],
        recentActivity: [],
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Real-time updates
    const channel = supabase
      .channel("admin-stats-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verification_requests",
        },
        () => {
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-8">טוען סטטיסטיקות...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בקשות ממתינות</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              מתוך {stats.totalVerificationRequests} סה"כ בקשות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בקשות מאושרות</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVerificationRequests > 0
                ? Math.round((stats.approvedRequests / stats.totalVerificationRequests) * 100)
                : 0}
              % שיעור אישור
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשים מאומתים</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0
                ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % מכלל המשתמשים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ משתמשים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">משתמשים רשומים</p>
          </CardContent>
        </Card>
      </div>

      {/* Trending Hashtags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            הטרנדים החמים ביותר
          </CardTitle>
          <CardDescription>הטגים הפופולריים ביותר כרגע</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.trendingHashtags.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">אין טרנדים כרגע</p>
          ) : (
            <div className="space-y-3">
              {stats.trendingHashtags.map((hashtag, index) => (
                <div
                  key={hashtag.tag}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-bold">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-semibold">#{hashtag.tag}</div>
                      <div className="text-xs text-muted-foreground">
                        {hashtag.recent_post_count} פוסטים היום
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{hashtag.post_count} פוסטים סה"כ</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Requests Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>פירוט בקשות אימות</CardTitle>
          <CardDescription>התפלגות סטטוס הבקשות</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>ממתינות</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.pendingRequests}</Badge>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalVerificationRequests > 0
                          ? (stats.pendingRequests / stats.totalVerificationRequests) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>אושרו</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.approvedRequests}</Badge>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalVerificationRequests > 0
                          ? (stats.approvedRequests / stats.totalVerificationRequests) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span>נדחו</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.rejectedRequests}</Badge>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-destructive h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalVerificationRequests > 0
                          ? (stats.rejectedRequests / stats.totalVerificationRequests) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
