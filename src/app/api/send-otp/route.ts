import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, otp, userName } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email and otp are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is not configured on the server. Please add it to your .env file to enable real-time emails.",
          fallback: true
        },
        { status: 400 }
      );
    }

    // Build premium styled HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Atlas AI Secure Verification Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #09090b;
      color: #fafafa;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      background-color: #09090b;
      padding: 32px 16px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 22px;
      font-weight: 900;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 16px;
      margin-bottom: 8px;
      text-align: center;
      letter-spacing: -0.025em;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #a1a1aa;
      margin-bottom: 24px;
      text-align: center;
    }
    .otp-box {
      background-color: #09090b;
      border: 1px solid #10b981;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-family: monospace;
      font-size: 32px;
      font-weight: 900;
      color: #10b981;
      letter-spacing: 0.25em;
    }
    .footer {
      font-size: 11px;
      color: #71717a;
      text-align: center;
      margin-top: 32px;
      border-top: 1px solid #27272a;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">Atlas AI</div>
      </div>
      <h2 class="title">Secure Cloud Sync Verification</h2>
      <p class="text">
        Hello ${userName || "Athlete"},<br>
        You are establishing a Secure Cloud Sync profile for your Atlas Coach. Use the verification code below to authorize this device.
      </p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p class="text" style="font-size: 12px; margin-bottom: 0;">
        This code is valid for 15 minutes. If you did not request this sync update, please ignore this message.
      </p>
      <div class="footer">
        Atlas AI Coach · Dynamic High-Performance Analytics · Private Local Sync
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Resend REST API Email Send
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Atlas AI Coach <onboarding@resend.dev>",
        to: [email.toLowerCase().trim()],
        subject: `Your Atlas AI Secure Verification Code [${otp}]`,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API returned an error:", resendData);
      return NextResponse.json(
        {
          success: false,
          error: resendData.message || "Failed to dispatch email via Resend API.",
        },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({ success: true, id: resendData.id });
  } catch (error: any) {
    console.error("Error inside send-otp API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
