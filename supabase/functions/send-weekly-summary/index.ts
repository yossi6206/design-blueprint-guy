import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeeklySummaryData {
  userName: string;
  userEmail: string;
  topPosts: Array<{
    content: string;
    author_name: string;
    author_handle: string;
    likes_count: number;
    comments_count: number;
    retweets_count: number;
  }>;
  userStats: {
    newFollowers: number;
    totalLikes: number;
    totalComments: number;
    totalPosts: number;
  };
}

const createWeeklySummaryEmail = (data: WeeklySummaryData): string => {
  const topPostsHtml = data.topPosts.map((post, index) => `
    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 10px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 10px;">
          ${index + 1}
        </span>
        <div>
          <strong>${post.author_name}</strong>
          <span style="color: #666; font-size: 14px;">@${post.author_handle}</span>
        </div>
      </div>
      <p style="margin: 10px 0; color: #333;">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
      <div style="display: flex; gap: 20px; color: #666; font-size: 14px;">
        <span>❤️ ${post.likes_count} לייקים</span>
        <span>💬 ${post.comments_count} תגובות</span>
        <span>🔄 ${post.retweets_count} שיתופים</span>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }
        .content {
          padding: 40px 30px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 30px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          margin: 10px 0;
        }
        .stat-label {
          color: #666;
          font-size: 14px;
        }
        .section-title {
          font-size: 24px;
          font-weight: bold;
          margin: 30px 0 20px 0;
          color: #333;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 15px 40px;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 הסיכום השבועי שלך</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">סיכום הפעילות והפוסטים הפופולריים השבוע</p>
        </div>
        <div class="content">
          <p style="font-size: 18px; color: #333;">
            שלום <strong>${data.userName}</strong>,
          </p>
          <p>
            הנה מה שקרה השבוע בפלטפורמה שלנו! 🎉
          </p>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">עוקבים חדשים</div>
              <div class="stat-number">${data.userStats.newFollowers}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">לייקים שקיבלת</div>
              <div class="stat-number">${data.userStats.totalLikes}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">תגובות שקיבלת</div>
              <div class="stat-number">${data.userStats.totalComments}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">פוסטים שפרסמת</div>
              <div class="stat-number">${data.userStats.totalPosts}</div>
            </div>
          </div>

          <h2 class="section-title">🔥 הפוסטים הכי פופולריים השבוע</h2>
          ${topPostsHtml}

          <p style="text-align: center; margin-top: 40px;">
            <a href="${supabaseUrl}" class="cta-button">
              צפה בעוד תוכן מעניין
            </a>
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            המשך ליצור תוכן מעניין ולהתחבר לקהילה! 💪
          </p>
        </div>
        <div class="footer">
          <p>תודה שאתה חלק מהקהילה שלנו! 💙</p>
          <p style="font-size: 12px; color: #999;">
            מייל זה נשלח אוטומטית אחת לשבוע. 
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getWeeklySummaryData = async (userId: string): Promise<WeeklySummaryData | null> => {
  try {
    // Get user profile and email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_name")
      .eq("id", userId)
      .single();

    if (!authUser?.user?.email || !profile) {
      console.log("User not found or no email:", userId);
      return null;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Get user stats from the last week
    const { data: newFollowers } = await supabase
      .from("follows")
      .select("id")
      .eq("following_id", userId)
      .gte("created_at", oneWeekAgoISO);

    const { data: userPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", oneWeekAgoISO);

    const userPostIds = userPosts?.map(p => p.id) || [];

    const { data: likesReceived } = await supabase
      .from("likes")
      .select("id")
      .in("post_id", userPostIds.length > 0 ? userPostIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("created_at", oneWeekAgoISO);

    const { data: commentsReceived } = await supabase
      .from("comments")
      .select("id")
      .in("post_id", userPostIds.length > 0 ? userPostIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("created_at", oneWeekAgoISO);

    // Get top posts from the last week
    const { data: topPosts } = await supabase
      .from("post_engagement_view")
      .select("*")
      .gte("created_at", oneWeekAgoISO)
      .order("engagement_score", { ascending: false })
      .limit(5);

    return {
      userName: profile.user_name,
      userEmail: authUser.user.email,
      topPosts: topPosts || [],
      userStats: {
        newFollowers: newFollowers?.length || 0,
        totalLikes: likesReceived?.length || 0,
        totalComments: commentsReceived?.length || 0,
        totalPosts: userPosts?.length || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching weekly summary data:", error);
    return null;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a test/preview request for a specific user
    const body = req.method === "POST" ? await req.json() : {};
    const testUserId = body.userId;

    if (testUserId) {
      console.log("Sending test email to user:", testUserId);
      
      const summaryData = await getWeeklySummaryData(testUserId);
      
      if (!summaryData) {
        return new Response(
          JSON.stringify({ error: "לא נמצאו נתונים למשתמש זה" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const emailHtml = createWeeklySummaryEmail(summaryData);

      const emailResponse = await resend.emails.send({
        from: "סיכום שבועי <weekly@twibber.co.il>",
        to: [summaryData.userEmail],
        subject: "📊 [דוגמה] הסיכום השבועי שלך - ראה מה קרה השבוע!",
        html: emailHtml,
      });

      console.log("Test email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        message: "מייל דוגמה נשלח בהצלחה!",
        email: summaryData.userEmail
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Regular weekly summary job for all users
    console.log("Starting weekly summary email job...");

    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id");

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users to send emails to`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Send email to each user
    for (const profile of profiles || []) {
      try {
        const summaryData = await getWeeklySummaryData(profile.id);

        if (!summaryData) {
          console.log(`Skipping user ${profile.id} - no data or email`);
          results.skipped++;
          continue;
        }

        // Skip if user has no activity
        if (summaryData.userStats.newFollowers === 0 && 
            summaryData.userStats.totalLikes === 0 && 
            summaryData.userStats.totalComments === 0 && 
            summaryData.userStats.totalPosts === 0) {
          console.log(`Skipping user ${profile.id} - no activity this week`);
          results.skipped++;
          continue;
        }

        const emailHtml = createWeeklySummaryEmail(summaryData);

        const emailResponse = await resend.emails.send({
          from: "סיכום שבועי <weekly@twibber.co.il>",
          to: [summaryData.userEmail],
          subject: "📊 הסיכום השבועי שלך - ראה מה קרה השבוע!",
          html: emailHtml,
        });

        console.log(`Email sent successfully to ${summaryData.userEmail}:`, emailResponse);
        results.success++;
      } catch (error) {
        console.error(`Failed to send email to user ${profile.id}:`, error);
        results.failed++;
      }
    }

    console.log("Weekly summary job completed:", results);

    return new Response(JSON.stringify({ 
      message: "Weekly summary emails sent",
      results 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-weekly-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
