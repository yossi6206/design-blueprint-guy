import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationRequest {
  id: string;
  full_name: string;
  profession: string;
  reason: string;
  social_links: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export default function VerificationRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    profession: "",
    reason: "",
    social_links: "",
  });

  useEffect(() => {
    checkAuthAndStatus();
  }, []);

  const checkAuthAndStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);

    // Check if user is already verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified, user_name")
      .eq("id", user.id)
      .single();

    if (profile?.is_verified) {
      setIsVerified(true);
    }

    // Check for existing request
    const { data: request } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (request) {
      setExistingRequest(request as VerificationRequest);
      setFormData({
        full_name: request.full_name,
        profession: request.profession,
        reason: request.reason,
        social_links: request.social_links || "",
      });
    } else if (profile?.user_name) {
      setFormData(prev => ({ ...prev, full_name: profile.user_name }));
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("verification_requests")
        .upsert({
          user_id: user.id,
          full_name: formData.full_name,
          profession: formData.profession,
          reason: formData.reason,
          social_links: formData.social_links || null,
          status: "pending",
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      toast({
        title: "הבקשה נשלחה בהצלחה!",
        description: "צוות המנהלים יבדוק את הבקשה שלך בקרוב",
      });

      checkAuthAndStatus();
    } catch (error: any) {
      toast({
        title: "שגיאה בשליחת הבקשה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />ממתין לבדיקה</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle2 className="w-3 h-3" />אושר</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />נדחה</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">טוען...</div>;
  }

  if (isVerified) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">החשבון שלך מאומת! ✓</CardTitle>
            <CardDescription>אתה כבר בעל תג מאומת כחול</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              החשבון שלך מסומן כמאומת וזה מוצג בכל הפוסטים שלך
            </p>
            <Button onClick={() => navigate("/")} className="gap-2">
              חזור לדף הבית <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                בקש תג מאומת
              </CardTitle>
              <CardDescription className="mt-2">
                תג מאומת מציין שהחשבון שלך אותנטי ובעל השפעה בקהילה
              </CardDescription>
            </div>
            {existingRequest && getStatusBadge(existingRequest.status)}
          </div>
        </CardHeader>
        <CardContent>
          {existingRequest?.status === "rejected" && existingRequest.admin_note && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h3 className="font-semibold text-destructive mb-2">הבקשה נדחתה</h3>
              <p className="text-sm text-muted-foreground">{existingRequest.admin_note}</p>
            </div>
          )}

          {existingRequest?.status === "pending" && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                הבקשה שלך ממתינה לבדיקה
              </h3>
              <p className="text-sm text-muted-foreground">
                צוות המנהלים בודק את הבקשה שלך. תקבל התראה כשהיא תיבדק.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">שם מלא *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={existingRequest?.status === "pending"}
                placeholder="השם המלא שלך"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">מקצוע / תחום עיסוק *</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                required
                disabled={existingRequest?.status === "pending"}
                placeholder="למשל: יוצר תוכן, עיתונאי, אמן"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">למה אתה ראוי לתג מאומת? *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                disabled={existingRequest?.status === "pending"}
                placeholder="ספר לנו על ההשפעה שלך, הקהילה שלך, ומה שהופך אותך לבולט"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_links">קישורים לרשתות חברתיות / אתר אישי (אופציונלי)</Label>
              <Textarea
                id="social_links"
                value={formData.social_links}
                onChange={(e) => setFormData({ ...formData, social_links: e.target.value })}
                disabled={existingRequest?.status === "pending"}
                placeholder="למשל: Instagram, LinkedIn, אתר אישי - כל קישור בשורה נפרדת"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={submitting || existingRequest?.status === "pending"}
                className="flex-1"
              >
                {submitting ? "שולח..." : existingRequest?.status === "pending" ? "הבקשה נשלחה" : "שלח בקשה"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                ביטול
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">יתרונות תג מאומת:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ תג כחול בפרופיל ובכל הפוסטים שלך</li>
              <li>✓ אמינות מוגברת בקרב הקהילה</li>
              <li>✓ בולטות במנוע החיפוש והמלצות</li>
              <li>✓ הצגה בולטת יותר בפיד</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
