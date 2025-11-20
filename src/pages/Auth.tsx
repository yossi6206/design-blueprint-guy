import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck } from "lucide-react";
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

  const samplePosts = [
    {
      id: 1,
      author: "ספורט ישראל",
      handle: "TruthSports",
      content: "רפאל נדאל ישחק עבור ספרד באולימפיאדה, יצטרף לקרלוס אלקראז בזוגות",
      verified: true,
      avatar: null,
      image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop",
      link: "bleacherreport.com/articles/10...",
    },
    {
      id: 2,
      author: "Catturd",
      handle: "catturd2",
      content: "קייטלין קלארק נדחתה מנבחרת האולימפית של ארה\"ב. הירייה הכי טובה בכל הזמנים. כמו להשאיר את מייקל ג'ורדן מחוץ לנבחרת החלום! למה???",
      verified: true,
      avatar: null,
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop",
      link: "thegatewaypundit.com/2024/06/c...",
    },
    {
      id: 3,
      author: "דונלד ג'יי טראמפ",
      handle: "realDonaldTrump",
      content: "TRUTH SOCIAL הוא הקול האמיתי של אמריקה!!!",
      verified: true,
      avatar: null,
    },
    {
      id: 4,
      author: "חדשות ישראל",
      handle: "NewsMax",
      content: "טראמפ לקח את הבמה שלו לפלטפורמת Truth Social להגיב לפני תחילת המשפט הפלילי בניו יורק ואמר שהוא ילחם על חופש הביטוי של האמריקאים. עוד על: bit.ly/3xFcVMz",
      verified: true,
      avatar: null,
      image: "https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=400&h=400&fit=crop",
    },
    {
      id: 5,
      author: "עסקים קטנים",
      handle: "SmallBiz",
      content: "יום של אריזה ותיאוריה על שדרוגי סקלה avsoapco.com | #havingasoap #shavesoap #smallbusiness #madeinusa",
      verified: false,
      avatar: null,
      image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&h=300&fit=crop",
    },
    {
      id: 6,
      author: "צילומים",
      handle: "Photographs",
      content: "Devil's Head Lookout in Sedalia, Colorado",
      verified: false,
      avatar: null,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    },
    {
      id: 7,
      author: "יין עם דוין",
      handle: "sake_wine_trading",
      content: "This Sparkling Sake is a full-fledged sparkling sake that uses secondary fermentation in the bottle into the traditional sake brewing method...",
      verified: false,
      avatar: null,
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Auth Form */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-black tracking-tight">
              <span className="text-[#5468FF]">TRUTH.</span>
            </div>
            <div className="space-y-0">
              <h1 className="text-5xl font-black tracking-tight text-black">
                הקול שלך.
              </h1>
              <h1 className="text-5xl font-black tracking-tight text-black">
                החופש שלך.
              </h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <Input
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 bg-white border-gray-300"
                />
                <Input
                  type="text"
                  placeholder="שם משתמש"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="h-12 bg-white border-gray-300"
                />
              </>
            )}
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-white border-gray-300"
            />
            <Input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-white border-gray-300"
            />

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-bold rounded-full bg-[#5468FF] hover:bg-[#4558EE] text-white shadow-none" 
              disabled={loading}
            >
              {loading ? "טוען..." : isSignUp ? "צור חשבון" : "צור חשבון"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full h-12 text-base font-normal text-gray-700 hover:bg-transparent hover:text-black"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? "התחבר" : "התחבר"}
            </Button>

            <p className="text-center text-xs text-gray-500 px-6">
              בהמשך, אתה מסכים ל
              <span className="underline cursor-pointer mx-1">תנאי השימוש</span>
              ו
              <span className="underline cursor-pointer mx-1">מדיניות הפרטיות</span>
            </p>
          </form>

          {/* App Store Buttons */}
          <div className="flex gap-3 justify-center pt-4">
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-xs">
                <div className="text-gray-600">הורד מ</div>
                <div className="font-semibold text-black">App Store</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div className="text-xs">
                <div className="text-gray-600">הורד מ</div>
                <div className="font-semibold text-black">Play Store</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Preview Content */}
      <div className="hidden lg:block lg:w-[60%] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/80 via-purple-100/60 to-blue-100/70"></div>
        
        {/* Scrollable content */}
        <div className="relative h-full overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {samplePosts.map((post) => (
              <Card 
                key={post.id} 
                className="p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-0 rounded-2xl"
              >
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={post.avatar || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                      {post.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-[15px] text-black">{post.author}</span>
                      {post.verified && (
                        <BadgeCheck className="h-[18px] w-[18px] text-red-500 fill-red-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-gray-500 text-sm mb-2">@{post.handle}</div>
                    <p className="text-[15px] text-black leading-relaxed mb-3">{post.content}</p>
                    {post.link && (
                      <a href="#" className="text-blue-600 text-sm hover:underline block mb-2">
                        {post.link}
                      </a>
                    )}
                    {post.image && (
                      <div className="rounded-xl overflow-hidden mt-3">
                        <img 
                          src={post.image} 
                          alt="Post content" 
                          className="w-full object-cover"
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
    </div>
  );
};

export default Auth;
