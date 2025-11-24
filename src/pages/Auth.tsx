import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Twitter, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import twitterLogo from "@/assets/twitter-logo.jpg";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get("mode") === "reset";
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(isResetMode);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isResetMode) {
      setIsResetPassword(true);
      setIsForgotPassword(false);
      setIsSignUp(false);
    }
  }, [isResetMode]);

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
              user_name: name,
              user_handle: handle,
            },
          },
        });
        if (error) throw error;
        
        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email,
              userName: name || 'משתמש חדש',
            },
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail the signup if email fails
        }
        
        setShowEmailConfirmation(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast({
              title: "דרוש אימות מייל",
              description: "אנא אמת את כתובת המייל שלך לפני ההתחברות. בדוק את תיבת הדואר שלך.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          navigate("/");
        }
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

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resetLink = `${window.location.origin}/auth?mode=reset`;
      
      // Call edge function to send custom email
      const { error: functionError } = await supabase.functions.invoke(
        'send-reset-password-email',
        {
          body: {
            email,
            resetLink,
          },
        }
      );

      if (functionError) {
        console.error("Edge function error:", functionError);
      }

      // Still call the Supabase reset to generate the token
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetLink,
      });
      
      if (error) throw error;
      
      toast({
        title: "מייל נשלח!",
        description: "בדוק את תיבת הדואר שלך לקישור איפוס הסיסמה",
      });
      setIsForgotPassword(false);
      setEmail("");
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      toast({
        title: "הסיסמה עודכנה!",
        description: "הסיסמה שלך שונתה בהצלחה",
      });
      
      navigate("/");
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
      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-primary opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-gradient-secondary opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Auth Form */}
      <div className="w-full flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {showEmailConfirmation ? (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-7xl">📧</div>
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    בדוק את המייל שלך
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    שלחנו לך מייל אימות ל-
                    <span className="font-semibold text-foreground block mt-1">{email}</span>
                  </p>
                  <p className="text-muted-foreground">
                    אנא לחץ על הקישור במייל כדי לאמת את החשבון שלך ולהתחיל להשתמש באפליקציה.
                  </p>
                </div>
              </div>
              <Card className="p-6 bg-muted/50">
                <div className="space-y-3 text-sm text-muted-foreground text-right">
                  <p>💡 <strong>טיפ:</strong> המייל עשוי להגיע לתיקיית הספאם</p>
                  <p>🔄 לא קיבלת מייל? בדוק את כתובת המייל או נסה להירשם שוב</p>
                </div>
              </Card>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setIsSignUp(false);
                  setEmail("");
                  setPassword("");
                  setName("");
                  setHandle("");
                }}
              >
                חזרה להתחברות
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <img src={twitterLogo} alt="Twitter Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                      {isForgotPassword ? "שחזור סיסמה" : isResetPassword ? "סיסמה חדשה" : "הקול שלך."}
                    </h1>
                    {!isForgotPassword && !isResetPassword && (
                      <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                        החופש שלך.
                      </h1>
                    )}
                  </div>
                </div>
              </div>

          {isResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                type="password"
                placeholder="סיסמה חדשה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
              <Input
                type="password"
                placeholder="אשר סיסמה"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300" 
                disabled={loading}
                size="lg"
              >
                {loading ? "מעדכן..." : "עדכן סיסמה"}
              </Button>
            </form>
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300" 
                disabled={loading}
                size="lg"
              >
                {loading ? "שולח..." : "שלח קישור לאיפוס"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsForgotPassword(false);
                  setEmail("");
                }}
                disabled={loading}
              >
                חזור להתחברות
              </Button>
            </form>
          ) : (
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
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300" 
              disabled={loading}
              size="lg"
            >
              {loading ? "טוען..." : isSignUp ? "צור חשבון" : "התחבר"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">או</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-lg"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              התחבר עם Google
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setIsForgotPassword(true)}
              disabled={loading}
            >
              שכחתי סיסמה
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
           )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
