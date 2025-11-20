import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  actor_id: string;
  actor_name: string;
  actor_handle: string;
  post_id: string | null;
  comment_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    fetchNotifications();

    // Subscribe to realtime updates with toast notification
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("התראה חדשה התקבלה:", payload);
          const newNotification = payload.new as Notification;
          
          // Show toast for new notification
          toast.info(`${newNotification.actor_name} ${getNotificationText(newNotification)}`, {
            duration: 5000,
          });
          
          // Refresh notifications
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
          console.log("התראה עודכנה");
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log("סטטוס חיבור realtime:", status);
        if (status === "SUBSCRIBED") {
          console.log("מחובר בהצלחה להתראות בזמן אמת");
        }
      });

    return () => {
      console.log("מתנתק מערוץ ההתראות");
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications((data || []) as Notification[]);
    const unread = data?.filter((n) => !n.is_read).length || 0;
    setUnreadCount(unread);
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
        return `הגיב: ${notification.content?.substring(0, 50)}${
          notification.content && notification.content.length > 50 ? "..." : ""
        }`;
      case "follow":
        return "התחיל לעקוב אחריך";
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-hover-bg transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-border p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">התראות</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              סמן הכל כנקרא
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              אין התראות חדשות
            </div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                to={
                  notification.type === "follow"
                    ? `/profile/${notification.actor_handle}`
                    : `/profile/${notification.actor_handle}`
                }
                onClick={() => {
                  markAsRead(notification.id);
                  setOpen(false);
                }}
                className={`block p-4 hover:bg-accent/50 transition-colors border-b border-border ${
                  !notification.is_read ? "bg-accent/20" : ""
                }`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {notification.actor_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {notification.actor_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{notification.actor_handle}
                      </span>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getNotificationText(notification)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
