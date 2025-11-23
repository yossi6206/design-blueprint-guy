import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  conversationId: string;
  currentUserId: string;
  typingChannel: RealtimeChannel | null;
}

export const MessageInput = ({ onSend, conversationId, currentUserId, typingChannel }: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingIndicator = (isTyping: boolean) => {
    if (typingChannel) {
      typingChannel.track({
        user_id: currentUserId,
        typing: isTyping,
      });
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    
    // שליחת אינדיקטור שהמשתמש מקליד
    if (value.trim() && !sending) {
      sendTypingIndicator(true);
      
      // איפוס הטיימר הקודם
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // הגדרת טיימר חדש שיעצור את האינדיקטור אחרי 3 שניות
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    } else if (!value.trim()) {
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין הודעה",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 1000) {
      toast({
        title: "שגיאה",
        description: "ההודעה ארוכה מדי (מקסימום 1000 תווים)",
        variant: "destructive",
      });
      return;
    }

    // עצירת אינדיקטור ההקלדה
    sendTypingIndicator(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    try {
      await onSend(content.trim());
      setContent("");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שליחת ההודעה נכשלה",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => {
      // ניקוי האינדיקטור כשהקומפוננטה נסגרת
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="כתוב הודעה..."
          className="resize-none"
          rows={1}
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !content.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-1 text-left">
        {content.length}/1000
      </div>
    </form>
  );
};
