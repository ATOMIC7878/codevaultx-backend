require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  console.log('📧 Testing REAL Email Sending...');
  console.log(`Mode: ${process.env.NODE_ENV}`);
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`User: ${process.env.EMAIL_USER}`);

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
      to: 'rohitrog7878@gmail.com',
      subject: '✅ CodeVaultX Email Test - REAL EMAIL',
      text: 'This is a real test email from CodeVaultX using Brevo SMTP.',
      html: `
                <h1>✅ Email Working!</h1>
                <p>This is a real test email from CodeVaultX.</p>
                <p>Your Brevo SMTP configuration is correct.</p>
                <p>Password reset emails will now work!</p>
            `,
    });
    console.log('✅ REAL EMAIL sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your Gmail inbox (and spam folder)');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
};

testEmail();
