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
      author: "יוסי כהן",
      handle: "yosicohen",
      content: "הרשת החברתית האמיתית של ישראל!!! מקום בו הקול של כולם נשמע.",
      verified: true,
      avatar: null,
      image: "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800&h=600&fit=crop",
    },
    {
      id: 2,
      author: "חדשות ישראל",
      handle: "NewsMax",
      content: "טראמפ לקח את הבמה שלו לאפליקציה החדשה ואמר שהוא ילחם על חופש הביטוי של האמריקאים. עוד על: bit.ly/3xFcVMz",
      verified: true,
      avatar: null,
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop",
    },
    {
      id: 3,
      author: "אבי חמדה",
      handle: "abrahamHamadeh",
      content: "הרשת החברתית הזו הרבה יותר כיפית מאשר X. אני ממש אוהב להגיב לאנשים אמיתיים!",
      verified: true,
      avatar: null,
    },
    {
      id: 4,
      author: "ספורט ישראל",
      handle: "TruthSports",
      content: "חדש - מיליוני בוחרים הולכים לקלפיות לבחירות האיחוד האירופי ביום ראשון העל.",
      verified: true,
      avatar: null,
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop",
    },
    {
      id: 5,
      author: "בבילון בי",
      handle: "BabylonBee",
      content: "אלק בולדווין אמור להנחות תוכנית חדשה ומרגשת 'זה טעון?'",
      verified: true,
      avatar: null,
    },
  ]);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Auth Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-lg space-y-10">
          <div className="text-center space-y-8">
            <div className="flex flex-col items-center gap-6">
              <div className="text-7xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  X.
                </span>
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900">
                  הקול שלך.
                </h1>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900">
                  החופש שלך.
                </h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <>
                <Input
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-14 text-base bg-gray-50 border-gray-200"
                />
                <Input
                  type="text"
                  placeholder="שם משתמש"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="h-14 text-base bg-gray-50 border-gray-200"
                />
              </>
            )}
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 text-base bg-gray-50 border-gray-200"
            />
            <Input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 text-base bg-gray-50 border-gray-200"
            />

            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-bold rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]" 
              disabled={loading}
              size="lg"
            >
              {loading ? "טוען..." : isSignUp ? "צור חשבון" : "התחבר"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-16 text-lg font-semibold rounded-full border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? "התחבר" : "צור חשבון"}
            </Button>

            <p className="text-center text-sm text-gray-500 px-8 leading-relaxed">
              בהמשך, אתה מסכים ל
              <span className="underline cursor-pointer hover:text-gray-900 mx-1">
                תנאי השימוש
              </span>
              ול
              <span className="underline cursor-pointer hover:text-gray-900 mx-1">
                מדיניות הפרטיות
              </span>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Preview Content */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
          {samplePosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="p-6 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl border border-gray-200/50 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-4">
                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                  <AvatarImage src={post.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                    {post.author[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{post.author}</span>
                    {post.verified && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500" />
                    )}
                    <span className="text-gray-500">@{post.handle}</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-base">{post.content}</p>
                  {post.image && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200">
                      <img 
                        src={post.image} 
                        alt="Post content" 
                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
