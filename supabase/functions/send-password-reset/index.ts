import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const createResetPasswordEmail = (resetLink: string, userEmail: string): string => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>איפוס סיסמה - X.</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        padding: 20px !important;
      }
      .content {
        padding: 30px 20px !important;
      }
      .logo {
        font-size: 36px !important;
      }
      .heading {
        font-size: 24px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <div class="logo" style="font-size: 56px; font-weight: 900; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; letter-spacing: -2px;">
                X.
              </div>
            </td>
          </tr>
          
          <!-- Main Content Card -->
          <tr>
            <td class="content" style="background: linear-gradient(180deg, #1e1e1e 0%, #1a1a1a 100%); border-radius: 16px; padding: 48px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);">
              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);">
                      <span style="color: #ffffff; font-size: 40px;">🔐</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h1 class="heading" style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 0 0 24px 0; text-align: center; letter-spacing: -0.5px;">
                איפוס סיסמה
              </h1>
              
              <p style="color: #e5e5e5; font-size: 16px; line-height: 26px; margin: 0 0 16px 0; text-align: center;">
                שלום 👋
              </p>
              
              <p style="color: #d4d4d4; font-size: 16px; line-height: 26px; margin: 0 0 32px 0; text-align: center;">
                קיבלנו בקשה לאיפוס הסיסמה עבור החשבון המשויך ל-<br>
                <strong style="color: #667eea; font-weight: 600;">${userEmail}</strong>
              </p>
              
              <!-- Primary Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 18px; font-weight: 700; text-decoration: none; padding: 18px 48px; border-radius: 12px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); transition: all 0.3s ease; letter-spacing: 0.5px;">
                      🔑 אפס את הסיסמה שלך
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td>
                    <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);"></div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #a3a3a3; font-size: 14px; line-height: 22px; margin: 0 0 16px 0; text-align: center;">
                או העתק והדבק את הקישור הזה בדפדפן שלך:
              </p>
              
              <!-- Link Box -->
              <div style="background-color: #0a0a0a; border-radius: 10px; border: 1px solid #2a2a2a; padding: 16px; margin: 0 0 32px 0; word-break: break-all; direction: ltr; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);">
                <a href="${resetLink}" style="color: #667eea; font-size: 13px; text-decoration: none; display: block; text-align: left;">${resetLink}</a>
              </div>
              
              <!-- Warning Notice -->
              <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); border-right: 4px solid #f59e0b; border-radius: 10px; padding: 16px 20px; margin: 0 0 24px 0;">
                <p style="color: #fbbf24; font-size: 14px; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">⏰</span>
                  הקישור תקף למשך שעה אחת בלבד
                </p>
              </div>
              
              <p style="color: #737373; font-size: 14px; line-height: 22px; margin: 0; text-align: center; padding: 20px 0 0 0; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                אם לא ביקשת לאפס את הסיסמה שלך, אתה יכול להתעלם מהמייל הזה בבטחה. 
                <span style="display: block; margin-top: 8px; color: #525252;">🔒 חשבונך מאובטח.</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="color: #a3a3a3; font-size: 16px; line-height: 24px; margin: 0 0 16px 0; font-weight: 500;">
                בברכה,<br>
                <strong style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">צוות X.</strong>
              </p>
              
              <p style="color: #525252; font-size: 12px; line-height: 18px; margin: 16px 0 0 0;">
                © 2025 X. כל הזכויות שמורות.
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    console.log("Processing password reset for:", email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate recovery link with token
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      throw linkError;
    }

    if (!data.properties?.action_link) {
      throw new Error("Failed to generate recovery link");
    }

    const recoveryLink = data.properties.action_link;
    console.log("Generated recovery link for:", email);

    // Create email HTML
    const html = createResetPasswordEmail(recoveryLink, email);

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "X. <onboarding@resend.dev>",
        to: [email],
        subject: "🔐 איפוס סיסמה - X.",
        html,
      }),
    });

    const resendData = await response.json();

    if (!response.ok) {
      console.error("Error sending email:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", resendData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
