import dns from 'dns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Force IPv4 first
dns.setDefaultResultOrder('ipv4first');

const email = process.env.SYSTEM_EMAIL?.trim().replace(/"/g, '');
const password = process.env.SYSTEM_PASSWORD?.trim().replace(/"/g, '');

console.log('Credentials loaded:');
console.log('Email:', email);
console.log('Password set:', !!password);

if (!email || !password) {
  console.error('SYSTEM_EMAIL or SYSTEM_PASSWORD not set in env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email,
    pass: password,
  },
});

async function run() {
  try {
    console.log('Sending test email via Gmail SMTP...');
    const info = await transporter.sendMail({
      from: `"MDRRMO System" <${email}>`,
      to: 'bertingmagiting16@gmail.com',
      subject: 'Test SMTP IPv4 First',
      text: 'This is a test email sent from the scratch test script.',
    });
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

run();
