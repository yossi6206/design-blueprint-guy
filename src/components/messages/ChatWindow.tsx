import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageInput } from "./MessageInput";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { ArrowRight, MoreVertical, Edit, Trash, Check, X, Search, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    markAsRead();

    // בקשת הרשאה להתראות
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

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
          const newMessage = payload.new as Message;
          setMessages((current) => [...current, newMessage]);
          
          if (newMessage.sender_id !== currentUserId) {
            markAsRead();
            
            // שלח התראה רק אם הטאב לא פעיל
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(`הודעה חדשה מ-${otherUser.user_name}`, {
                body: newMessage.content,
                icon: otherUser.avatar_url || '/placeholder.svg',
                tag: conversationId,
              });
              
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((current) =>
            current.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
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
      // עדכון last_read_at של המשתמש
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId);

      // עדכון is_read של כל ההודעות שלא מהמשתמש הנוכחי
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId)
        .eq("is_read", false);

      // עדכון המסרים המקומיים
      setMessages((current) =>
        current.map((msg) =>
          msg.sender_id !== currentUserId ? { ...msg, is_read: true } : msg
        )
      );
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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages((current) => current.filter((msg) => msg.id !== messageId));
      toast({
        title: "ההודעה נמחקה בהצלחה",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "שגיאה במחיקת ההודעה",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ content: editContent })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((current) =>
        current.map((msg) =>
          msg.id === messageId ? { ...msg, content: editContent } : msg
        )
      );
      setEditingMessageId(null);
      setEditContent("");
      toast({
        title: "ההודעה עודכנה בהצלחה",
      });
    } catch (error) {
      console.error("Error updating message:", error);
      toast({
        title: "שגיאה בעדכון ההודעה",
        variant: "destructive",
      });
    }
  };

  const filteredMessages = messages.filter((message) =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* חיפוש הודעות */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="חפש הודעות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* הודעות */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {filteredMessages.length === 0 && searchQuery ? (
            <div className="text-center text-muted-foreground py-8">
              לא נמצאו הודעות התואמות לחיפוש
            </div>
          ) : (
            filteredMessages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const isEditing = editingMessageId === message.id;
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
                  {isEditing ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(message.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSaveEdit(message.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-start group">
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      {isOwn && (
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStartEdit(message.id, message.content)
                                }
                              >
                                <Edit className="h-4 w-4 ml-2" />
                                ערוך
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-destructive"
                              >
                                <Trash className="h-4 w-4 ml-2" />
                                מחק
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </span>
                    {isOwn && (
                      message.is_read ? (
                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
          
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
