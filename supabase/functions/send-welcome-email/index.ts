import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  userName: string;
}

const createWelcomeEmail = (userName: string): string => {
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
        .welcome-text {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .highlight {
          color: #667eea;
          font-weight: bold;
        }
        .features {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .feature-item {
          margin: 15px 0;
          padding-right: 25px;
          position: relative;
        }
        .feature-item:before {
          content: "✓";
          position: absolute;
          right: 0;
          color: #667eea;
          font-weight: bold;
          font-size: 18px;
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
          <h1>🎉 ברוכים הבאים!</h1>
        </div>
        <div class="content">
          <p class="welcome-text">
            שלום <span class="highlight">${userName}</span>,
          </p>
          <p class="welcome-text">
            תודה שהצטרפת אלינו! אנחנו שמחים לראות אותך כאן.
          </p>
          <p>
            הצטרפת בהצלחה לקהילה שלנו. עכשיו אתה יכול ליהנות מכל התכונות המדהימות שיש לנו להציע:
          </p>
          <div class="features">
            <div class="feature-item">שתף את המחשבות והרעיונות שלך</div>
            <div class="feature-item">עקוב אחרי אנשים מעניינים</div>
            <div class="feature-item">קבל עדכונים והתראות בזמן אמת</div>
            <div class="feature-item">התחבר לקהילה תוססת</div>
          </div>
          <p style="text-align: center;">
            <a href="${Deno.env.get("VITE_SUPABASE_URL")}" class="cta-button">
              התחל עכשיו
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            אם יש לך שאלות או שאתה צריך עזרה, אל תהסס לפנות אלינו.
          </p>
        </div>
        <div class="footer">
          <p>מקווים שתהנה מהחוויה! 💙</p>
          <p style="font-size: 12px; color: #999;">
            קיבלת מייל זה כי נרשמת לשירות שלנו.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const emailHtml = createWelcomeEmail(userName);

    const emailResponse = await resend.emails.send({
      from: "ברוכים הבאים <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 ברוכים הבאים! ההרשמה הושלמה בהצלחה",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
