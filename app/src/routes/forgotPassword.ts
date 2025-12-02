import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "../utils/mailer";
import { User } from "./login";
import { database } from "../utils/database";
import { hashResetToken } from "../utils/auth";

const RESET_TOKEN_EXPIRATION_HOURS = 1;

export const forgotPassword = async (req: Request, res: Response) => {
  const { email, from_name, callback_host } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const db = await database.getDb();
    const user = await db.collection<User>("auth_users").findOne({ email });

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res
        .status(200)
        .json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
    }

    // 1. Generate a secure, unique token
    const resetToken = randomBytes(32).toString("hex"); // 64 character hex string
    const resetTokenHash = hashResetToken(resetToken);
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000,
    ); // 1 hour from now

    // 2. Invalidate any existing tokens for this user
    // This prevents a user from having multiple active reset links
    await db.collection("password_reset_tokens").updateMany(
      { userId: user._id, used: false },
      { $set: { used: true } }, // Mark previous tokens as used/invalidated
    );

    // 3. Store the hashed token in the database
    const result = await db.collection("password_reset_tokens").insertOne({
      userId: user._id,
      tokenHash: resetTokenHash,
      createdAt: new Date(),
      expiresAt: expiresAt,
      used: false,
    });

    if (!result.acknowledged) {
      throw new Error("Failed to store reset token.");
    }

    // 4. Construct the reset link for the email
    const resetLink = `${callback_host}/reset-password.html?token=${resetToken}`;

    // 5. Send the email
    await sendPasswordResetEmail(user.email, from_name, resetLink);

    return res
      .status(200)
      .json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
  } catch (error: any) {
    console.error(`Forgot Password Error: ${error.message}`, error);
    return res.status(500).json({
      error: "password_reset_failed",
      message: "An unexpected error occurred during password reset request.",
    });
  }
};
