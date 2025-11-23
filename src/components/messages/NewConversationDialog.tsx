import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, BadgeCheck } from "lucide-react";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  is_verified: boolean;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onConversationCreated: (conversationId: string, otherUser: Profile) => void;
}

export const NewConversationDialog = ({
  open,
  onOpenChange,
  currentUserId,
  onConversationCreated,
}: NewConversationDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .or(`user_name.ilike.%${searchQuery}%,user_handle.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "שגיאה",
        description: "החיפוש נכשל",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleCreateConversation = async (otherUser: Profile) => {
    setCreating(true);
    try {
      // בדיקה אם קיימת כבר שיחה עם המשתמש
      const { data: existingParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", participant.conversation_id)
            .eq("user_id", otherUser.id)
            .single();

          if (otherParticipant) {
            // כבר קיימת שיחה
            onConversationCreated(participant.conversation_id, otherUser);
            onOpenChange(false);
            setSearchQuery("");
            setSearchResults([]);
            return;
          }
        }
      }

      // יצירת שיחה חדשה - הקוד יחזיר את ה-ID אוטומטית
      const { data, error: convError } = await supabase
        .from("conversations")
        .insert([{}])
        .select("id");

      if (convError) throw convError;
      if (!data || data.length === 0) throw new Error("Failed to create conversation");
      
      const conversationId = data[0].id;

      // הוספת שני המשתתפים
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversationId, user_id: currentUserId },
          { conversation_id: conversationId, user_id: otherUser.id },
        ]);

      if (participantsError) {
        // נסה למחוק את השיחה אם הוספת המשתתפים נכשלה
        await supabase.from("conversations").delete().eq("id", conversationId);
        throw participantsError;
      }

      onConversationCreated(conversationId, otherUser);
      onOpenChange(false);
      setSearchQuery("");
      setSearchResults([]);

      toast({
        title: "הצלחה",
        description: "השיחה נוצרה בהצלחה",
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "שגיאה",
        description: "יצירת השיחה נכשלה",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>שיחה חדשה</DialogTitle>
          <DialogDescription>חפש משתמשים כדי להתחיל שיחה</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="חפש לפי שם או שם משתמש..."
              disabled={searching || creating}
            />
            <Button
              onClick={handleSearch}
              disabled={searching || creating || !searchQuery.trim()}
              size="icon"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(user)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-right"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold">{user.user_name}</p>
                      {user.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-background fill-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{user.user_handle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <p className="text-center text-muted-foreground py-4">
              לא נמצאו משתמשים
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
