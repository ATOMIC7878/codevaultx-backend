const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      '⚠️ Email service not configured. Password reset emails will be logged to console.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

exports.sendPasswordResetEmail = async (email, username, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

  // Development mode - log to console (ONLY if missing credentials)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 [DEV MODE] Password Reset Email would be sent to:', email);
    console.log('🔗 Reset Link:', resetUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  const mailOptions = {
    from: `"CodeVaultX Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Request - CodeVaultX',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; background-color: #0a0a0f; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .content { background: #1a1a2e; border-radius: 16px; padding: 30px; border: 1px solid rgba(6, 182, 212, 0.2); }
          .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { color: #f59e0b; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body style="background-color: #0a0a0f; margin: 0; padding: 0;">
        <div class="container">
          <div class="header">
            <div class="logo">CodeVaultX</div>
            <p style="color: #06b6d4; margin-top: 8px;">Secure Code Snippet Management</p>
          </div>
          <div class="content">
            <h2 style="color: white; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #d1d5db;">Hello <strong style="color: #06b6d4;">${username}</strong>,</p>
            <p style="color: #d1d5db;">We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
            </div>
            <p style="color: #d1d5db;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background: #0a0a0f; padding: 12px; border-radius: 8px; word-break: break-all; color: #06b6d4; font-size: 12px;">${resetUrl}</p>
            <div class="warning">
              ⚠️ This link will expire in <strong>10 minutes</strong> for security reasons.
            </div>
          </div>
          <div class="footer">
            <p>If you didn't request this, please ignore this email or contact support.</p>
            <p>&copy; 2025 CodeVaultX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

exports.sendUsernameRecoveryEmail = async (email, username) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth`;

  // Development mode - log to console (ONLY if missing credentials)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 [DEV MODE] Username Recovery Email would be sent to:', email);
    console.log('👤 Your username is:', username);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  const mailOptions = {
    from: `"CodeVaultX Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '👤 Username Reminder - CodeVaultX',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; background-color: #0a0a0f; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .content { background: #1a1a2e; border-radius: 16px; padding: 30px; border: 1px solid rgba(6, 182, 212, 0.2); }
          .username-box { background: #0a0a0f; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #06b6d4; }
          .username { font-size: 24px; font-weight: bold; color: #06b6d4; font-family: monospace; }
          .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body style="background-color: #0a0a0f; margin: 0; padding: 0;">
        <div class="container">
          <div class="header">
            <div class="logo">CodeVaultX</div>
          </div>
          <div class="content">
            <h2 style="color: white; margin-top: 0;">Username Reminder</h2>
            <p style="color: #d1d5db;">Hello,</p>
            <p style="color: #d1d5db;">You requested a reminder of your username associated with this email address.</p>
            <div class="username-box">
              <div style="color: #9ca3af; font-size: 12px; margin-bottom: 8px;">Your username is:</div>
              <div class="username">${username}</div>
            </div>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to CodeVaultX</a>
            </div>
          </div>
          <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
            <p>&copy; 2025 CodeVaultX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Username recovery email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};
