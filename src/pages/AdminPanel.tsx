import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldCheck, BarChart3, Mail } from "lucide-react";
import { VerificationPanel } from "@/components/VerificationPanel";
import { StatisticsOverview } from "@/components/admin/StatisticsOverview";

const variantSchema = z.object({
  name: z.string().min(1, "שם הווריאנט נדרש"),
  description: z.string().optional(),
  trafficAllocation: z.number().min(0).max(100),
  isControl: z.boolean(),
  useMlBoost: z.boolean(),
  maxScoreMultiplier: z.number().min(1).max(10),
});

const experimentSchema = z.object({
  name: z.string().min(1, "שם הניסוי נדרש"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed"]),
  variants: z.array(variantSchema).min(2, "נדרשים לפחות 2 ווריאנטים"),
});

type ExperimentForm = z.infer<typeof experimentSchema>;
type VariantForm = z.infer<typeof variantSchema>;

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminRole();
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  const form = useForm<ExperimentForm>({
    resolver: zodResolver(experimentSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
      variants: [
        {
          name: "Control",
          description: "בסיס",
          trafficAllocation: 50,
          isControl: true,
          useMlBoost: false,
          maxScoreMultiplier: 1,
        },
        {
          name: "Variant A",
          description: "ווריאציה עם ML",
          trafficAllocation: 50,
          isControl: false,
          useMlBoost: true,
          maxScoreMultiplier: 1.5,
        },
      ],
    },
  });

  const variants = form.watch("variants");

  const addVariant = () => {
    const currentVariants = form.getValues("variants");
    form.setValue("variants", [
      ...currentVariants,
      {
        name: `Variant ${String.fromCharCode(65 + currentVariants.length - 1)}`,
        description: "",
        trafficAllocation: 0,
        isControl: false,
        useMlBoost: false,
        maxScoreMultiplier: 1,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    const currentVariants = form.getValues("variants");
    if (currentVariants.length <= 2) {
      toast.error("חייבים לפחות 2 ווריאנטים");
      return;
    }
    form.setValue(
      "variants",
      currentVariants.filter((_, i) => i !== index)
    );
  };

  const sendTestEmail = async () => {
    if (!currentUserId) {
      toast.error("לא נמצא משתמש מחובר");
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-weekly-summary", {
        body: { userId: currentUserId },
      });

      if (error) throw error;

      toast.success(`מייל דוגמה נשלח בהצלחה! 📧`);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "שגיאה בשליחת מייל דוגמה");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const onSubmit = async (data: ExperimentForm) => {
    setIsCreating(true);
    try {
      // בדיקת סכום traffic allocation
      const totalTraffic = data.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (totalTraffic !== 100) {
        toast.error(`סכום חלוקת התעבורה חייב להיות 100% (כרגע: ${totalTraffic}%)`);
        setIsCreating(false);
        return;
      }

      // יצירת הניסוי
      const { data: experiment, error: experimentError } = await supabase
        .from("experiments")
        .insert({
          name: data.name,
          description: data.description,
          status: data.status,
          start_date: data.status === "active" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (experimentError) throw experimentError;

      // יצירת הווריאנטים
      const variantsToInsert = data.variants.map((variant) => ({
        experiment_id: experiment.id,
        name: variant.name,
        description: variant.description,
        traffic_allocation: variant.trafficAllocation,
        is_control: variant.isControl,
        algorithm_config: {
          use_ml_boost: variant.useMlBoost,
          max_score_multiplier: variant.maxScoreMultiplier,
        },
      }));

      const { error: variantsError } = await supabase
        .from("experiment_variants")
        .insert(variantsToInsert);

      if (variantsError) throw variantsError;

      toast.success("הניסוי נוצר בהצלחה!");
      navigate("/experiments");
    } catch (error: any) {
      console.error("Error creating experiment:", error);
      toast.error(error.message || "שגיאה ביצירת הניסוי");
    } finally {
      setIsCreating(false);
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">גישה נדחתה</h1>
        <p className="text-muted-foreground mb-4">אין לך הרשאות אדמין</p>
        <Button onClick={() => navigate("/")}>חזרה לדף הבית</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            סטטיסטיקות
          </TabsTrigger>
          <TabsTrigger value="verifications" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            אימותים
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="w-4 h-4" />
            מיילים
          </TabsTrigger>
          <TabsTrigger value="experiments">ניסויי A/B</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics">
          <StatisticsOverview />
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>מיילים שבועיים</CardTitle>
              <CardDescription>
                ניהול מערכת המיילים השבועיים האוטומטיים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold">📬 איך זה עובד?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ המערכת עוברת על כל המשתמשים פעם בשבוע</li>
                  <li>✅ אוספת נתונים על הפעילות מהשבוע האחרון</li>
                  <li>✅ שולחת מייל רק למי שהיה פעיל (לא שולחת מיילים ריקים)</li>
                  <li>✅ כוללת את הפוסטים הפופולריים ביותר בקהילה</li>
                  <li>✅ המערכת רצה אוטומטית כל יום ראשון בבוקר</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">🧪 בדיקת מייל דוגמה</h3>
                <p className="text-sm text-muted-foreground">
                  רוצה לראות איך המייל השבועי ייראה? שלח לעצמך מייל דוגמה עם הנתונים שלך מהשבוע האחרון
                </p>
                <Button
                  onClick={sendTestEmail}
                  disabled={isSendingTestEmail}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isSendingTestEmail && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  <Mail className="ml-2 h-4 w-4" />
                  שלח מייל דוגמה למייל שלי
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>טיפ:</strong> המייל ישלח לכתובת המייל שרשומה בחשבון שלך. בדוק את תיבת הדואר (ואת תיקיית הספאם אם צריך)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>יצירת ניסוי A/B חדש</CardTitle>
              <CardDescription>
                הגדר ניסוי חדש עם ווריאנטים שונים של אלגוריתם המלצות
              </CardDescription>
            </CardHeader>
            <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם הניסוי</FormLabel>
                    <FormControl>
                      <Input placeholder="למשל: אלגוריתם ML משופר v2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תיאור (אופציונלי)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="תאר את מטרת הניסוי..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">טיוטה</SelectItem>
                        <SelectItem value="active">פעיל</SelectItem>
                        <SelectItem value="paused">מושהה</SelectItem>
                        <SelectItem value="completed">הושלם</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      רק ניסויים פעילים ישפיעו על המשתמשים
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">ווריאנטים</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף ווריאנט
                  </Button>
                </div>

                {variants.map((variant, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{variant.name}</CardTitle>
                        {!variant.isControl && variants.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>תיאור</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.trafficAllocation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אחוז תעבורה (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.useMlBoost`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">הפעל ML Boost</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variants.${index}.maxScoreMultiplier`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>מכפיל ציון מקסימלי</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step={0.1}
                                  min={1}
                                  max={10}
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  צור ניסוי
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/experiments")}>
                  ביטול
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="verifications">
          <VerificationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
