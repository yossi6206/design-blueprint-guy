import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderHandle: string;
  messageContent: string;
  conversationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      senderName, 
      senderHandle, 
      messageContent,
      conversationId 
    }: MessageNotificationRequest = await req.json();

    console.log("Sending message notification to:", recipientEmail);

    const messagesUrl = `https://twibber.co.il/messages`;

    const emailResponse = await resend.emails.send({
      from: "Twibber <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `הודעה חדשה מ-${senderName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
              color: #ffffff;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
              color: #333333;
            }
            .message-box {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              border-right: 4px solid #667eea;
            }
            .sender-info {
              font-size: 14px;
              color: #666666;
              margin-bottom: 10px;
            }
            .sender-name {
              font-weight: 600;
              color: #333333;
            }
            .message-content {
              font-size: 16px;
              line-height: 1.6;
              color: #333333;
              margin-top: 10px;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 14px 40px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background-color: #f8f9fa;
              padding: 25px;
              text-align: center;
              color: #666666;
              font-size: 13px;
              border-top: 1px solid #e0e0e0;
            }
            .footer-text {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 הודעה חדשה ב-Twibber</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 10px;">שלום ${recipientName},</p>
              <p style="font-size: 15px; color: #666666;">קיבלת הודעה חדשה מ-${senderName}</p>
              
              <div class="message-box">
                <div class="sender-info">
                  מאת: <span class="sender-name">${senderName}</span> <span style="color: #999;">@${senderHandle}</span>
                </div>
                <div class="message-content">
                  "${messageContent}"
                </div>
              </div>
              
              <div class="button-container">
                <a href="${messagesUrl}" class="button">הצג הודעות</a>
              </div>
              
              <p style="font-size: 14px; color: #999999; text-align: center; margin-top: 30px;">
                לחץ על הכפתור למעלה כדי לקרוא ולהשיב להודעה
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-text">© 2024 Twibber. כל הזכויות שמורות.</p>
              <p class="footer-text">קיבלת אימייל זה כיון שמישהו שלח לך הודעה פרטית ב-Twibber</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Message notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending message notification:", error);
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
