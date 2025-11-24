import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, AtSign, Rocket, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "new_post" | "retweet" | "mention" | "boost" | "verification_approved" | "verification_rejected";
  actor_id: string;
  actor_name: string;
  actor_handle: string;
  post_id: string | null;
  comment_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!currentUserId) return;

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("notifications-page-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications((data || []) as Notification[]);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    fetchNotifications();
    toast.success("כל ההתראות סומנו כנקראו");
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return "אהב את הפוסט שלך";
      case "comment":
        return `הגיב: ${notification.content?.substring(0, 100)}${
          notification.content && notification.content.length > 100 ? "..." : ""
        }`;
      case "follow":
        return "התחיל לעקוב אחריך";
      case "new_post":
        return `פרסם: ${notification.content?.substring(0, 100)}${
          notification.content && notification.content.length > 100 ? "..." : ""
        }`;
      case "retweet":
        return notification.content
          ? `ציטט את הפוסט שלך: ${notification.content.substring(0, 100)}${
              notification.content.length > 100 ? "..." : ""
            }`
          : "עשה ריטוויט לפוסט שלך";
      case "mention":
        return "תייג אותך בפוסט";
      case "boost":
        return "קידם את הפוסט שלך 🚀";
      case "verification_approved":
        return `✓ בקשת האימות שלך אושרה! ${notification.content || ""}`;
      case "verification_rejected":
        return `✗ בקשת האימות שלך נדחתה. ${notification.content || ""}`;
      default:
        return "";
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return "עכשיו";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `לפני ${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="flex min-h-screen bg-background justify-center pb-16 md:pb-0">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 border-x border-border min-h-screen max-w-[600px] w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="px-3 md:px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg md:text-xl font-bold">התראות</h1>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs md:text-sm"
                >
                  סמן הכל כנקרא
                </Button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 md:p-8 lg:p-16 text-center max-w-lg mx-auto">
              <div className="flex justify-center mb-4 md:mb-6">
                <div className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-accent/50 flex items-center justify-center">
                  <Bell className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">אין התראות עדיין</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                כשמשהו מעניין יקרה, תראה את זה כאן
              </p>
              
              <div className="text-right space-y-2 md:space-y-4">
                <p className="text-sm md:text-base font-semibold text-foreground mb-3 md:mb-4">תקבל התראות על:</p>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <Heart className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">לייקים</span>
                    <span className="text-xs md:text-sm text-muted-foreground">כשמישהו אוהב את הפוסטים שלך</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <MessageCircle className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">תגובות</span>
                    <span className="text-xs md:text-sm text-muted-foreground">כשמגיבים לפוסט שלך</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <UserPlus className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">עוקבים חדשים</span>
                    <span className="text-xs md:text-sm text-muted-foreground">כשמישהו עוקב אחריך</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <Repeat2 className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">ריטוויטים</span>
                    <span className="text-xs md:text-sm text-muted-foreground">כשמשתפים את הפוסט שלך</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <AtSign className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">תיוגים</span>
                    <span className="text-xs md:text-sm text-muted-foreground">כשמתייגים אותך בפוסט</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <Rocket className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">קידומים</span>
                    <span className="text-xs md:text-sm text-muted-foreground">כשמקדמים את הפוסט שלך</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 mt-1 flex-shrink-0 text-primary" />
                  <div className="text-right flex-1">
                    <span className="text-sm md:text-base font-semibold text-foreground block mb-0.5 md:mb-1">אימותים</span>
                    <span className="text-xs md:text-sm text-muted-foreground">עדכונים על בקשות אימות</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={
                    notification.type === "follow"
                      ? `/profile/${notification.actor_handle}`
                      : `/profile/${notification.actor_handle}`
                  }
                   onClick={() => markAsRead(notification.id)}
                  className={`block p-3 md:p-4 hover:bg-accent/50 transition-colors border-b border-border ${
                    !notification.is_read ? "bg-accent/20" : ""
                  }`}
                >
                  <div className="flex gap-2 md:gap-3">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarFallback>
                        {notification.actor_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                        <span className="text-sm md:text-base font-bold truncate">
                          {notification.actor_name}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground truncate">
                          @{notification.actor_handle}
                        </span>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground break-words">
                        {getNotificationText(notification)}
                      </p>
                      <span className="text-xs text-muted-foreground mt-0.5 md:mt-1 block">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <MobileNav />
    </>
  );
}
