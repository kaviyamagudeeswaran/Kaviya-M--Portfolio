import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '2525', 10),
  secure: false,
});

export const sendPasswordResetEmail = async (to: string, from_name: string, resetLink: string) => {
  try {
    await transporter.sendMail({
      from: `"${from_name}" <noreply@storm.dev>`,
      to: to,
      subject: 'Password Reset Request', 
      html: `
        <p>You requested a password reset for your account.</p>
        <p>Please click on the following link to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${to}:`, error);
    throw new Error('Failed to send password reset email.');
  }
};