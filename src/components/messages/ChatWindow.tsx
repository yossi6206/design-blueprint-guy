import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageInput } from "./MessageInput";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_handle: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserHandle: string;
  otherUser: {
    id: string;
    user_name: string;
    user_handle: string;
    avatar_url: string | null;
  };
  onBack: () => void;
}

export const ChatWindow = ({
  conversationId,
  currentUserId,
  currentUserName,
  currentUserHandle,
  otherUser,
  onBack,
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetchMessages();
    markAsRead();

    // הקשבה להודעות חדשות בזמן אמת
    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
          if (payload.new.sender_id !== currentUserId) {
            markAsRead();
          }
        }
      )
      .subscribe();

    // ערוץ נפרד עבור typing indicators
    const typingChannel = supabase.channel(`typing-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const typingUsers = Object.values(state).flat();
        const otherUserTyping = typingUsers.some(
          (user: any) => user.user_id === otherUser.id && user.typing === true
        );
        setIsOtherUserTyping(otherUserTyping);
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, currentUserId, otherUser.id]);

  useEffect(() => {
    // גלילה אוטומטית להודעה האחרונה
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_handle: currentUserHandle,
        content,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* כותרת */}
      <div className="border-b p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatar_url || ""} />
          <AvatarFallback>{otherUser.user_name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{otherUser.user_name}</h3>
          <p className="text-sm text-muted-foreground">@{otherUser.user_handle}</p>
        </div>
      </div>

      {/* הודעות */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  isOwn ? "flex-row-reverse" : ""
                }`}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherUser.avatar_url || ""} />
                    <AvatarFallback>{otherUser.user_name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`flex flex-col max-w-[70%] ${
                    isOwn ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* אינדיקטור הקלדה */}
          {isOtherUserTyping && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="h-8 w-8">
                <AvatarImage src={otherUser.avatar_url || ""} />
                <AvatarFallback>{otherUser.user_name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* קלט הודעה */}
      <MessageInput 
        onSend={handleSendMessage}
        conversationId={conversationId}
        currentUserId={currentUserId}
        typingChannel={typingChannelRef.current}
      />
    </div>
  );
};
