import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Twitter } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Twitter className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold">
            {isSignUp ? "הצטרף עכשיו" : "התחבר"}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-6">
          {isSignUp && (
            <>
              <Input
                type="text"
                placeholder="שם מלא"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="שם משתמש"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
              />
            </>
          )}
          <Input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "טוען..." : isSignUp ? "הירשם" : "התחבר"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? "כבר יש לך חשבון? התחבר" : "אין לך חשבון? הירשם"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
