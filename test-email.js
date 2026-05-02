require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  console.log('📧 Testing Brevo SMTP Configuration...');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log(`Pass: ${process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing'}`);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"CodeVaultX Test" <${process.env.EMAIL_USER}>`,
      to: 'rohitrog7878@gmail.com', // Change to your email for testing
      subject: '✅ CodeVaultX Email Test Successful!',
      text: 'Your Brevo SMTP configuration is working correctly.',
      html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background: #0a0a0f; color: white; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 30px; border: 1px solid #06b6d4;">
                        <h1 style="color: #06b6d4;">✅ Email Test Successful!</h1>
                        <p>Your Brevo SMTP configuration is working correctly.</p>
                        <p style="background: #0a0a0f; padding: 10px; border-radius: 8px;">
                            <strong>Configuration:</strong><br>
                            Host: ${process.env.EMAIL_HOST}<br>
                            Port: ${process.env.EMAIL_PORT}<br>
                            User: ${process.env.EMAIL_USER}
                        </p>
                        <p style="color: #8b5cf6;">CodeVaultX is ready to send password reset emails!</p>
                    </div>
                </body>
                </html>
            `,
    });
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🔗 Check your inbox (and spam folder) at rohitrog7878@gmail.com');
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error('Error details:', error.message);
    if (error.response) console.error('Response:', error.response);
  }
};

testEmail();
