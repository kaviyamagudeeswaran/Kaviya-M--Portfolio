import { NextFunction, Request, Response } from "express";
import { database } from "../utils/database";
import { hashResetToken, hashPassword } from "../utils/auth";

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing token or new password" });
  }
  // Optional: Add password complexity requirements here
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  try {
    const db = await database.getDb();
    const receivedTokenHash = hashResetToken(token);

    // 1. Find the token in the database
    const resetTokenDoc = await db.collection("password_reset_tokens").findOne({
      tokenHash: receivedTokenHash,
      used: false, // Ensure it hasn't been used yet
      expiresAt: { $gt: new Date() }, // Ensure it's not expired
    });

    if (!resetTokenDoc) {
      return res
        .status(400)
        .json({ error: "Invalid or expired password reset token." });
    }

    // 2. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 3. Update the user's password
    const updateResult = await db
      .collection("auth_users")
      .updateOne(
        { _id: resetTokenDoc.userId },
        { $set: { password: hashedPassword } },
      );

    if (updateResult.matchedCount === 0) {
      throw new Error("User not found for the provided token.");
    }

    // 4. Mark the token as used to prevent reuse
    await db
      .collection("password_reset_tokens")
      .updateOne({ _id: resetTokenDoc._id }, { $set: { used: true } });

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (error: any) {
    console.error(`Reset Password Error: ${error.message}`, error);
    return res.status(500).json({
      error: "password_reset_failed",
      message: "An unexpected error occurred during password reset.",
    });
  }
};
