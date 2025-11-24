import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ConversationsList } from "@/components/messages/ConversationsList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquarePlus } from "lucide-react";

interface Profile {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState<Profile | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    setCurrentUser(user);

    // קבלת פרטי הפרופיל
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setCurrentProfile(profile);
    setLoading(false);
  };

  const handleSelectConversation = (conversationId: string, otherUser: Profile) => {
    setSelectedConversationId(conversationId);
    setSelectedOtherUser(otherUser);
  };

  const handleConversationCreated = (conversationId: string, otherUser: Profile) => {
    setSelectedConversationId(conversationId);
    setSelectedOtherUser(otherUser);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    setSelectedOtherUser(null);
  };

  if (loading || !currentUser || !currentProfile) {
    return <div className="flex items-center justify-center h-screen">טוען...</div>;
  }

  return (
    <>
      <div className="flex h-screen bg-background pb-16 md:pb-0">
        {/* סרגל צד - רשימת שיחות */}
        <div
          className={`${
            selectedConversationId ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 border-l`}
        >
          <div className="border-b p-3 md:p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h2 className="text-lg md:text-xl font-bold">הודעות</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewConversation(true)}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <MessageSquarePlus className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        
        <ConversationsList
          currentUserId={currentUser.id}
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId}
        />
      </div>

      {/* אזור הצ'אט */}
      <div
        className={`${
          selectedConversationId ? "flex" : "hidden md:flex"
        } flex-1 flex-col`}
      >
        {selectedConversationId && selectedOtherUser ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={currentUser.id}
            currentUserName={currentProfile.user_name}
            currentUserHandle={currentProfile.user_handle}
            otherUser={selectedOtherUser}
            onBack={handleBack}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center p-6 md:p-8">
            <div>
              <MessageSquarePlus className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">בחר שיחה</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                בחר שיחה מהרשימה או התחל שיחה חדשה
              </p>
            </div>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        currentUserId={currentUser.id}
        onConversationCreated={handleConversationCreated}
      />
      </div>
      <MobileNav />
    </>
  );
};

export default Messages;
