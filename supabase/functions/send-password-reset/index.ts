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
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 60px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; width: 100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <svg width="80" height="65" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.643 2.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.737 4.568 4.692 4.692 0 0 1-2.104.08 4.661 4.661 0 0 0 4.352 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.47 9.47 0 0 0 2.323-2.41z" fill="url(#gradient)"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
            </td>
          </tr>
          
          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="color: #0a0a0a; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                שחזור סיסמה
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0;">
                שלום! קיבלנו בקשה לאיפוס הסיסמה עבור<br>
                <strong style="color: #0a0a0a;">${userEmail}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 12px; letter-spacing: 0.3px;">
                שלח קישור לאיפוס
              </a>
            </td>
          </tr>
          
          <!-- Link alternative -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 0 0 12px 0;">
                או העתק את הקישור הזה:
              </p>
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 12px; word-break: break-all; direction: ltr;">
                <a href="${resetLink}" style="color: #667eea; font-size: 12px; text-decoration: none;">${resetLink}</a>
              </div>
            </td>
          </tr>
          
          <!-- Warning -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="color: #a3a3a3; font-size: 13px; line-height: 20px; margin: 0;">
                הקישור תקף למשך שעה אחת בלבד
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <p style="color: #a3a3a3; font-size: 13px; line-height: 20px; margin: 0;">
                אם לא ביקשת לאפס את הסיסמה, אתה יכול להתעלם מהמייל הזה
              </p>
              <p style="color: #d4d4d4; font-size: 12px; margin: 16px 0 0 0;">
                © 2025 X. כל הזכויות שמורות
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
        from: "X. <noreply@twibber.co.il>",
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
