import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationData {
  user_email: string;
  type: string;
  actor_name: string;
  actor_handle: string;
  content?: string;
  post_content?: string;
}

const getEmailTemplate = (notification: NotificationData) => {
  const { type, actor_name, actor_handle, content, post_content } = notification;
  
  let subject = "";
  let mainMessage = "";
  let icon = "";
  
  switch (type) {
    case "like":
      subject = `${actor_name} אהב את הפוסט שלך`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) אהב את הפוסט שלך`;
      icon = "❤️";
      break;
    case "comment":
      subject = `${actor_name} הגיב על הפוסט שלך`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) הגיב על הפוסט שלך`;
      icon = "💬";
      break;
    case "follow":
      subject = `${actor_name} התחיל לעקוב אחריך`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) התחיל לעקוב אחריך`;
      icon = "👤";
      break;
    case "retweet":
      subject = `${actor_name} שיתף את הפוסט שלך`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) שיתף את הפוסט שלך`;
      icon = "🔄";
      break;
    case "mention":
      subject = `${actor_name} תייג אותך בפוסט`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) תייג אותך בפוסט`;
      icon = "📢";
      break;
    case "boost":
      subject = `${actor_name} הגביר את הפוסט שלך`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) הגביר את הפוסט שלך`;
      icon = "⚡";
      break;
    case "message":
      subject = `${actor_name} שלח לך הודעה`;
      mainMessage = `<strong>${actor_name}</strong> (@${actor_handle}) שלח לך הודעה`;
      icon = "✉️";
      break;
    default:
      subject = `פעילות חדשה`;
      mainMessage = `יש לך פעילות חדשה`;
      icon = "🔔";
  }

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
              animation: bounce 1s ease-in-out;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            .header h1 {
              color: white;
              font-size: 28px;
              margin: 0;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .message {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              padding: 25px;
              border-radius: 15px;
              margin-bottom: 25px;
              border-right: 5px solid #667eea;
              font-size: 16px;
              line-height: 1.6;
              color: #2d3748;
            }
            .post-preview {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 12px;
              margin-top: 20px;
              border: 2px solid #e2e8f0;
              font-size: 15px;
              color: #4a5568;
              line-height: 1.5;
            }
            .post-preview strong {
              color: #2d3748;
              display: block;
              margin-bottom: 10px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
              transition: all 0.3s ease;
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 15px 35px rgba(102, 126, 234, 0.5);
            }
            .footer {
              background: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 3px solid #e2e8f0;
            }
            .footer p {
              color: #718096;
              font-size: 14px;
              line-height: 1.6;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
              font-weight: 600;
            }
            .divider {
              height: 2px;
              background: linear-gradient(to left, transparent, #cbd5e0, transparent);
              margin: 25px 0;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 20px 10px;
              }
              .header {
                padding: 30px 20px;
              }
              .header h1 {
                font-size: 24px;
              }
              .content {
                padding: 30px 20px;
              }
              .icon {
                font-size: 48px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">${icon}</div>
              <h1>${subject}</h1>
            </div>
            
            <div class="content">
              <div class="message">
                ${mainMessage}
              </div>
              
              ${content ? `
                <div class="post-preview">
                  <strong>תוכן:</strong>
                  ${content}
                </div>
              ` : ''}
              
              ${post_content ? `
                <div class="post-preview">
                  <strong>הפוסט המקורי:</strong>
                  ${post_content}
                </div>
              ` : ''}
              
              <div class="divider"></div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://twibber.co.il" class="cta-button">
                  צפה בפעילות 🚀
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>
                קיבלת את המייל הזה כי אפשרת התראות במייל.<br>
                <a href="#">ניהול העדפות</a> • <a href="#">ביטול התראות</a>
              </p>
              <p style="margin-top: 15px; color: #a0aec0; font-size: 12px;">
                © 2025 Social Network. כל הזכויות שמורות.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: NotificationData = await req.json();
    
    console.log("Sending notification email:", notification);

    const { subject, html } = getEmailTemplate(notification);

    const emailResponse = await resend.emails.send({
      from: "Twibber <notifications@twibber.co.il>",
      to: [notification.user_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
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
