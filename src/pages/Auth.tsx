import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Twitter, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get("mode") === "reset";
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(isResetMode);
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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetLink,
      });
      
      if (error) throw error;
      
      toast({
        title: "✅ מייל נשלח בהצלחה!",
        description: "בדוק את תיבת הדואר שלך (כולל תיקיית הספאם) וללחץ על הקישור לאיפוס הסיסמה",
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

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, text: "", color: "" };
    if (pass.length < 6) return { strength: 1, text: "חלשה", color: "bg-red-500" };
    if (pass.length < 8) return { strength: 2, text: "בינונית", color: "bg-yellow-500" };
    
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    const strengthLevel = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strengthLevel >= 3 && pass.length >= 10) return { strength: 4, text: "חזקה מאוד", color: "bg-green-600" };
    if (strengthLevel >= 2 && pass.length >= 8) return { strength: 3, text: "חזקה", color: "bg-green-500" };
    return { strength: 2, text: "בינונית", color: "bg-yellow-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "❌ שגיאה",
        description: "הסיסמאות אינן תואמות. נסה שוב.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "❌ סיסמה חלשה",
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
        title: "✅ הסיסמה עודכנה בהצלחה!",
        description: "אתה מועבר כעת לדף הבית",
      });
      
      setTimeout(() => navigate("/"), 1500);
    } catch (error: any) {
      toast({
        title: "❌ שגיאה",
        description: error.message || "לא הצלחנו לעדכן את הסיסמה. נסה שוב.",
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
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="text-7xl font-bold relative">
                <span className="bg-gradient-primary bg-clip-text text-transparent">X.</span>
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
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="סיסמה חדשה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.text && (
                      <p className="text-xs text-muted-foreground text-center">
                        חוזק הסיסמה: <span className={passwordStrength.strength >= 3 ? "text-green-500" : "text-yellow-500"}>{passwordStrength.text}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <Input
                type="password"
                placeholder="אשר סיסמה"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />

              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 text-center">
                  ⚠️ הסיסמאות אינן תואמות
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300" 
                disabled={loading || password !== confirmPassword || password.length < 6}
                size="lg"
              >
                {loading ? "מעדכן..." : "🔐 עדכן סיסמה"}
              </Button>

              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">💡 טיפים לסיסמה חזקה:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>לפחות 8 תווים</li>
                  <li>אותיות גדולות וקטנות</li>
                  <li>מספרים ותווים מיוחדים (!@#$%)</li>
                </ul>
              </div>
            </form>
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  🔐 נשלח לך מייל עם קישור לאיפוס הסיסמה
                </p>
              </div>

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
                {loading ? "📧 שולח..." : "📧 שלח קישור לאיפוס"}
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
                ← חזור להתחברות
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
        </div>
      </div>
    </div>
  );
};

export default Auth;
