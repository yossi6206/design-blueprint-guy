import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";

interface ExperimentMetrics {
  variantName: string;
  isControl: boolean;
  totalShown: number;
  totalFollowed: number;
  totalDismissed: number;
  conversionRate: number;
  dismissalRate: number;
}

export default function ExperimentDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<ExperimentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [experimentName, setExperimentName] = useState("");

  useEffect(() => {
    fetchExperimentMetrics();
  }, []);

  const fetchExperimentMetrics = async () => {
    try {
      setLoading(true);

      // Get active experiment
      const { data: experiment } = await supabase
        .from('experiments')
        .select('id, name')
        .eq('status', 'active')
        .single();

      if (!experiment) {
        toast.error("אין ניסוי פעיל");
        return;
      }

      setExperimentName(experiment.name);

      // Get variants
      const { data: variants } = await supabase
        .from('experiment_variants')
        .select('id, name, is_control')
        .eq('experiment_id', experiment.id);

      if (!variants) return;

      // Calculate metrics for each variant
      const metricsPromises = variants.map(async (variant) => {
        const { data: variantMetrics } = await supabase
          .from('experiment_metrics')
          .select('metric_type')
          .eq('experiment_id', experiment.id)
          .eq('variant_id', variant.id);

        const totalShown = variantMetrics?.filter(m => m.metric_type === 'suggestion_shown').length || 0;
        const totalFollowed = variantMetrics?.filter(m => m.metric_type === 'suggestion_followed').length || 0;
        const totalDismissed = variantMetrics?.filter(m => m.metric_type === 'suggestion_dismissed').length || 0;

        return {
          variantName: variant.name,
          isControl: variant.is_control,
          totalShown,
          totalFollowed,
          totalDismissed,
          conversionRate: totalShown > 0 ? (totalFollowed / totalShown) * 100 : 0,
          dismissalRate: totalShown > 0 ? (totalDismissed / totalShown) * 100 : 0,
        };
      });

      const calculatedMetrics = await Promise.all(metricsPromises);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error("שגיאה בטעינת נתוני הניסוי");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">טוען נתוני ניסוי...</p>
      </div>
    );
  }

  const control = metrics.find(m => m.isControl);
  const variants = metrics.filter(m => !m.isControl);

  return (
    <div className="flex min-h-screen bg-background justify-center">
      <div className="w-full max-w-6xl border-x border-border p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold mb-2">דאשבורד A/B Testing</h1>
          <p className="text-muted-foreground">{experimentName}</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ המלצות הוצגו</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.reduce((sum, m) => sum + m.totalShown, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ עקיבות</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.reduce((sum, m) => sum + m.totalFollowed, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ דחיות</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.reduce((sum, m) => sum + m.totalDismissed, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variant Comparison */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">השוואת גרסאות</h2>

          {control && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {control.variantName}
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Control
                  </span>
                </CardTitle>
                <CardDescription>גרסת הבסיס לניסוי</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">הוצגו</p>
                    <p className="text-2xl font-bold">{control.totalShown}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">עקיבות</p>
                    <p className="text-2xl font-bold text-green-600">{control.totalFollowed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">אחוז המרה</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {control.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">אחוז דחייה</p>
                    <p className="text-2xl font-bold text-red-600">
                      {control.dismissalRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {variants.map((variant) => {
            const improvement = control 
              ? ((variant.conversionRate - control.conversionRate) / control.conversionRate) * 100
              : 0;

            return (
              <Card key={variant.variantName} className="border-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {variant.variantName}
                    {improvement > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{improvement.toFixed(1)}%
                      </span>
                    )}
                    {improvement < 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        {improvement.toFixed(1)}%
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>גרסת ניסוי</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">הוצגו</p>
                      <p className="text-2xl font-bold">{variant.totalShown}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">עקיבות</p>
                      <p className="text-2xl font-bold text-green-600">{variant.totalFollowed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">אחוז המרה</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {variant.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">אחוז דחייה</p>
                      <p className="text-2xl font-bold text-red-600">
                        {variant.dismissalRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle>תובנות</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {control && variants[0] && (
                <>
                  <li>
                    • אחוז ההמרה של {variants[0].variantName} הוא {variants[0].conversionRate.toFixed(1)}% 
                    לעומת {control.conversionRate.toFixed(1)}% בגרסת הבסיס
                  </li>
                  {variants[0].conversionRate > control.conversionRate && (
                    <li className="text-green-600 font-semibold">
                      • ✓ {variants[0].variantName} מציג שיפור של{' '}
                      {(((variants[0].conversionRate - control.conversionRate) / control.conversionRate) * 100).toFixed(1)}%{' '}
                      באחוז ההמרה
                    </li>
                  )}
                  {variants[0].dismissalRate < control.dismissalRate && (
                    <li className="text-green-600 font-semibold">
                      • ✓ {variants[0].variantName} מציג אחוז דחייה נמוך יותר ({variants[0].dismissalRate.toFixed(1)}%)
                    </li>
                  )}
                </>
              )}
              <li className="text-muted-foreground mt-4">
                המשך לאסוף נתונים כדי להשיג מובהקות סטטיסטית. מומלץ לפחות 100 המלצות לכל וריאנט.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
