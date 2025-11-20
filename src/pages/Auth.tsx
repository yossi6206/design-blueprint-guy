import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Twitter, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
              handle,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "נרשמת בהצלחה!",
          description: "כעת תוכל להתחבר",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [samplePosts] = useState([
    {
      id: 1,
      author: "מוחמד עלי",
      handle: "muhammadali",
      content: "הקול שלך חשוב! הצטרף לשיחה והיה חלק מהשינוי.",
      verified: true,
      avatar: null,
    },
    {
      id: 2,
      author: "שרה כהן",
      handle: "sarahcohen",
      content: "פלטפורמה מדהימה לחיבור אמיתי עם אנשים אמיתיים!",
      verified: true,
      avatar: null,
    },
    {
      id: 3,
      author: "דוד לוי",
      handle: "davidlevi",
      content: "סוף סוף מקום שבו אפשר לדבר בחופשיות ולהתחבר לקהילה.",
      verified: false,
      avatar: null,
    },
  ]);

  return (
    <div className="h-screen bg-background flex relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-primary opacity-20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-gradient-secondary opacity-20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-accent opacity-10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Auth Form */}
      <div className="w-full flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="text-7xl font-bold relative">
                <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%] drop-shadow-glow-primary">X.</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  הקול שלך.
                </h1>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  החופש שלך.
                </h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <Input
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                />
                <Input
                  type="text"
                  placeholder="שם משתמש"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="h-12"
                />
              </>
            )}
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
            <Input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
            />

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow-primary hover:shadow-glow-secondary border-0" 
              disabled={loading}
              size="lg"
            >
              {loading ? "טוען..." : isSignUp ? "צור חשבון" : "התחבר"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-lg"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? "התחבר" : "צור חשבון"}
            </Button>

            <p className="text-center text-xs text-muted-foreground px-8">
              בהמשך, אתה מסכים ל
              <span className="underline cursor-pointer hover:text-foreground mx-1">
                תנאי השימוש
              </span>
              ול
              <span className="underline cursor-pointer hover:text-foreground mx-1">
                מדיניות הפרטיות
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
