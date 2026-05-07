// Native fetch is built into Node.js 18+ - no require needed

// Helper function to send email via Brevo API
const sendBrevoEmail = async (emailData) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log('📧 [DEV MODE] BREVO_API_KEY missing, logging only');
    return { success: true, isDevMode: true };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Email sent successfully. Message ID: ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    } else {
      console.error('❌ Brevo API Error:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

exports.sendPasswordResetEmail = async (email, username, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://codevaultx.netlify.app';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  // Using Brevo's default sender - works with your API key
  const senderEmail = 'a9f283001@smtp-brevo.com';
  const senderName = 'CodeVaultX';

  console.log(`📧 Preparing password reset email...`);
  console.log(`📧 To: ${email}`);
  console.log(`📧 From: ${senderEmail}`);
  console.log(`🔗 Reset link: ${resetUrl}`);

  const emailData = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: email,
        name: username,
      },
    ],
    subject: '🔐 Password Reset Request - CodeVaultX',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0a0a0f;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 24px;
            padding: 40px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .logo-sub {
            text-align: center;
            color: #06b6d4;
            font-size: 12px;
            letter-spacing: 2px;
            margin-top: 5px;
          }
          h2 {
            color: white;
            margin-top: 0;
            font-size: 24px;
          }
          p {
            color: #d1d5db;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #06b6d4, #8b5cf6);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            margin: 20px 0;
          }
          .link-box {
            background: #0a0a0f;
            padding: 12px;
            border-radius: 12px;
            word-break: break-all;
            color: #06b6d4;
            font-size: 12px;
            font-family: monospace;
            margin: 15px 0;
          }
          .warning {
            color: #f59e0b;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <div class="logo-text">CodeVaultX</div>
              <div class="logo-sub">SECURE YOUR LOGIC</div>
            </div>
            <h2>Password Reset Request</h2>
            <p>Hello <strong style="color: #06b6d4;">${username}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-box">${resetUrl}</div>
            <div class="warning">
              ⚠️ This link will expire in <strong>10 minutes</strong> for security reasons.
            </div>
            <div class="footer">
              <p>If you didn't request this, please ignore this email.</p>
              <p>&copy; 2025 CodeVaultX. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const result = await sendBrevoEmail(emailData);

  if (result.success) {
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } else {
    console.error(`❌ Failed to send password reset email to: ${email}`);
    return false;
  }
};

exports.sendUsernameRecoveryEmail = async (email, username) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://codevaultx.netlify.app';
  const loginUrl = `${frontendUrl}/auth`;

  const senderEmail = 'a9f283001@smtp-brevo.com';
  const senderName = 'CodeVaultX';

  console.log(`📧 Preparing username recovery email...`);
  console.log(`📧 To: ${email}`);
  console.log(`📧 From: ${senderEmail}`);
  console.log(`👤 Username: ${username}`);

  const emailData = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: email,
        name: username,
      },
    ],
    subject: '👤 Username Reminder - CodeVaultX',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0a0a0f;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 24px;
            padding: 40px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .logo-sub {
            text-align: center;
            color: #06b6d4;
            font-size: 12px;
            letter-spacing: 2px;
            margin-top: 5px;
          }
          h2 {
            color: white;
            margin-top: 0;
            font-size: 24px;
          }
          p {
            color: #d1d5db;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .username-box {
            background: #0a0a0f;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #06b6d4;
          }
          .username {
            font-size: 28px;
            font-weight: bold;
            color: #06b6d4;
            font-family: monospace;
            letter-spacing: 2px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #06b6d4, #8b5cf6);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <div class="logo-text">CodeVaultX</div>
              <div class="logo-sub">SECURE YOUR LOGIC</div>
            </div>
            <h2>Username Reminder</h2>
            <p>Hello,</p>
            <p>You requested a reminder of your username associated with this email address.</p>
            <div class="username-box">
              <div style="color: #9ca3af; font-size: 12px; margin-bottom: 8px;">Your username is:</div>
              <div class="username">${username}</div>
            </div>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to CodeVaultX</a>
            </div>
            <div class="footer">
              <p>If you didn't request this, please ignore this email.</p>
              <p>&copy; 2025 CodeVaultX. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const result = await sendBrevoEmail(emailData);

  if (result.success) {
    console.log(`✅ Username recovery email sent to: ${email}`);
    return true;
  } else {
    console.error(`❌ Failed to send username recovery email to: ${email}`);
    return false;
  }
};
