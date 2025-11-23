import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { BadgeCheck } from "lucide-react";

interface Conversation {
  id: string;
  last_message_at: string;
  other_user: {
    id: string;
    user_name: string;
    user_handle: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  last_message: {
    content: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

interface ConversationsListProps {
  currentUserId: string;
  onSelectConversation: (conversationId: string, otherUser: any) => void;
  selectedConversationId: string | null;
}

export const ConversationsList = ({
  currentUserId,
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    // בקשת הרשאה להתראות
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // הקשבה לעדכונים בזמן אמת
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // בדוק אם ההודעה היא לא מהמשתמש הנוכחי
          if (newMessage.sender_id !== currentUserId) {
            // קבלת פרטי השולח
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("user_name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single();

            // שלח התראה רק אם הטאב לא פעיל
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && senderProfile) {
              const notification = new Notification(`הודעה חדשה מ-${senderProfile.user_name}`, {
                body: newMessage.content,
                icon: senderProfile.avatar_url || '/placeholder.svg',
                tag: newMessage.conversation_id,
              });
              
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
          }
          
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      // קבלת כל השיחות של המשתמש
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", currentUserId);

      if (participantError) throw participantError;

      const conversationIds = participantData.map((p) => p.conversation_id);

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // קבלת פרטי השיחות
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("last_message_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      // לכל שיחה, קבלת המשתמש השני והודעה אחרונה
      const conversationsWithDetails = await Promise.all(
        conversationsData.map(async (conv) => {
          // קבלת המשתמש השני בשיחה
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .neq("user_id", currentUserId)
            .single();

          if (!otherParticipant) return null;

          // קבלת פרטי המשתמש השני
          const { data: otherUserProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", otherParticipant.user_id)
            .single();

          // קבלת ההודעה האחרונה
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // ספירת הודעות שלא נקראו
          const participantInfo = participantData.find(
            (p) => p.conversation_id === conv.id
          );
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", currentUserId)
            .gt("created_at", participantInfo?.last_read_at || "1970-01-01");

          return {
            id: conv.id,
            last_message_at: conv.last_message_at,
            other_user: otherUserProfile,
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(
        conversationsWithDetails.filter((c) => c !== null) as Conversation[]
      );
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-muted-foreground text-lg mb-2">אין שיחות עדיין</p>
        <p className="text-sm text-muted-foreground">
          התחל שיחה חדשה עם משתמשים אחרים
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() =>
              onSelectConversation(conv.id, conv.other_user)
            }
            className={`w-full text-right p-4 rounded-lg transition-colors hover:bg-accent ${
              selectedConversationId === conv.id
                ? "bg-accent"
                : conv.unread_count > 0 
                ? "bg-accent/50" 
                : ""
            }`}
          >
            <div className="flex gap-3 items-start">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.other_user.avatar_url || ""} />
                <AvatarFallback>
                  {conv.other_user.user_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold truncate">
                      {conv.other_user.user_name}
                    </span>
                    {conv.other_user.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-background fill-primary shrink-0" />
                    )}
                  </div>
                  {conv.last_message_at && (
                    <span className="text-xs text-muted-foreground mr-2">
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {conv.last_message
                      ? conv.last_message.sender_id === currentUserId
                        ? `את/ה: ${conv.last_message.content}`
                        : conv.last_message.content
                      : "אין הודעות עדיין"}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};
