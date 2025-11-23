import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string;
  profession: string;
  reason: string;
  social_links: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    user_name: string;
    user_handle: string;
    avatar_url: string | null;
  };
}

export function VerificationPanel() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchRequests();

    const channel = supabase
      .channel("verification-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verification_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchRequests = async () => {
    const { data: requestsData, error } = await supabase
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching verification requests:", error);
      setLoading(false);
      return;
    }

    if (!requestsData) {
      setLoading(false);
      return;
    }

    // Fetch profiles for all requests
    const userIds = requestsData.map(r => r.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, user_name, user_handle, avatar_url")
      .in("id", userIds);

    // Combine data
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const combinedData = requestsData.map(request => ({
      ...request,
      profiles: profilesMap.get(request.user_id) || null,
    }));

    setRequests(combinedData as VerificationRequest[]);
    setLoading(false);
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType || !currentUserId) return;

    setProcessing(true);

    try {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "שגיאה",
          description: "אין לך הרשאות אדמין לאשר בקשות",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      if (actionType === "approve") {
        const { error } = await supabase.rpc("approve_verification_request", {
          request_id: selectedRequest.id,
          admin_user_id: currentUserId,
          note: adminNote || null,
        });

        if (error) throw error;

        toast({
          title: "בקשת האימות אושרה!",
          description: `${selectedRequest.full_name} קיבל תג מאומת`,
        });
      } else {
        if (!adminNote.trim()) {
          toast({
            title: "שגיאה",
            description: "חובה לספק סיבה לדחייה",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        const { error } = await supabase.rpc("reject_verification_request", {
          request_id: selectedRequest.id,
          admin_user_id: currentUserId,
          note: adminNote,
        });

        if (error) throw error;

        toast({
          title: "בקשת האימות נדחתה",
          description: `המשתמש ${selectedRequest.full_name} יקבל התראה`,
        });
      }

      setSelectedRequest(null);
      setActionType(null);
      setAdminNote("");
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (request: VerificationRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNote("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />ממתין</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle2 className="w-3 h-3" />אושר</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />נדחה</Badge>;
      default:
        return null;
    }
  };

  const renderRequestCard = (request: VerificationRequest) => (
    <Card key={request.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={request.profiles?.avatar_url || undefined} />
              <AvatarFallback>{request.full_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.full_name}</CardTitle>
              <CardDescription>
                @{request.profiles?.user_handle} · {request.profession}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">סיבה:</h4>
          <p className="text-sm text-muted-foreground">{request.reason}</p>
        </div>

        {request.social_links && (
          <div>
            <h4 className="font-semibold text-sm mb-1">קישורים:</h4>
            <div className="space-y-1">
              {request.social_links.split("\n").map((link, i) => (
                link.trim() && (
                  <a
                    key={i}
                    href={link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {link.trim()} <ExternalLink className="w-3 h-3" />
                  </a>
                )
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          נשלח: {new Date(request.created_at).toLocaleDateString("he-IL")} בשעה{" "}
          {new Date(request.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
        </div>

        {request.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => openActionDialog(request, "approve")}
              className="flex-1 gap-1"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              אשר
            </Button>
            <Button
              onClick={() => openActionDialog(request, "reject")}
              variant="destructive"
              className="flex-1 gap-1"
              size="sm"
            >
              <XCircle className="w-4 h-4" />
              דחה
            </Button>
          </div>
        )}

        {request.status !== "pending" && request.admin_note && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-1">הערת מנהל:</h4>
            <p className="text-sm text-muted-foreground">{request.admin_note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            ניהול בקשות אימות
          </CardTitle>
          <CardDescription>
            בדוק ואשר/דחה בקשות לתג מאומת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="gap-2">
                ממתינות ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                אושרו ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                נדחו ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[600px] mt-4">
              <TabsContent value="pending" className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין בקשות ממתינות
                  </p>
                ) : (
                  pendingRequests.map(renderRequestCard)
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {approvedRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין בקשות מאושרות
                  </p>
                ) : (
                  approvedRequests.map(renderRequestCard)
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {rejectedRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין בקשות שנדחו
                  </p>
                ) : (
                  rejectedRequests.map(renderRequestCard)
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "אישור בקשת אימות" : "דחיית בקשת אימות"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `אתה עומד לאשר את הבקשה של ${selectedRequest?.full_name}`
                : `אתה עומד לדחות את הבקשה של ${selectedRequest?.full_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-note">
                הערה למשתמש {actionType === "reject" && "*"}
              </Label>
              <Textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "הערה אופציונלית למשתמש"
                    : "חובה לספק סיבה לדחייה"
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} disabled={processing}>
              ביטול
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionType === "reject" && !adminNote.trim())}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {processing ? "מעבד..." : actionType === "approve" ? "אשר בקשה" : "דחה בקשה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
