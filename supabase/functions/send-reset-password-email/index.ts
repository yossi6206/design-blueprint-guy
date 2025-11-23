import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  resetLink: string;
}

const createResetPasswordEmail = (resetLink: string, userEmail: string): string => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>איפוס סיסמה - X.</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="font-size: 48px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block;">
                X.
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #1a1a1a; border-radius: 12px; padding: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 30px 0; text-align: center;">
                איפוס סיסמה
              </h1>
              
              <p style="color: #e5e5e5; font-size: 16px; line-height: 24px; margin: 16px 0;">
                שלום,
              </p>
              
              <p style="color: #e5e5e5; font-size: 16px; line-height: 24px; margin: 16px 0;">
                קיבלנו בקשה לאיפוס הסיסמה עבור החשבון המשויך ל-${userEmail}.
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: all 0.3s ease;">
                      אפס את הסיסמה שלך
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #e5e5e5; font-size: 16px; line-height: 24px; margin: 16px 0;">
                או העתק והדבק את הקישור הזה בדפדפן שלך:
              </p>
              
              <div style="color: #a3a3a3; font-size: 14px; line-height: 20px; margin: 16px 0; padding: 12px; background-color: #0a0a0a; border-radius: 6px; border: 1px solid #2a2a2a; word-break: break-all; direction: ltr;">
                ${resetLink}
              </div>
              
              <p style="color: #a3a3a3; font-size: 14px; line-height: 20px; margin: 16px 0;">
                הקישור תקף למשך 24 שעות בלבד.
              </p>
              
              <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                אם לא ביקשת לאפס את הסיסמה שלך, אתה יכול להתעלם מהמייל הזה בבטחה.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #2a2a2a; margin-top: 32px;">
              <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 8px 0; text-align: center;">
                בברכה,<br>
                צוות X.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: ResetPasswordRequest = await req.json();

    console.log("Sending reset password email to:", email);

    const html = createResetPasswordEmail(resetLink, email);

    // Send email using Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "X. <onboarding@resend.dev>",
        to: [email],
        subject: "איפוס סיסמה - X.",
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error sending email:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reset-password-email function:", error);
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
