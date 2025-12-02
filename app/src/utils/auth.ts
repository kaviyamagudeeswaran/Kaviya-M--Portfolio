import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { timingSafeEqual } from "crypto";
import { createHash } from "crypto";

const scryptAsync = promisify(scrypt);

export function getUserId(req: Request): string {
  // In a real app, you'd extract this from JWT or session
  return (req.user as any)?.id || "";
}

export function getTenantId(req: Request): string {
  return (req.headers["X-Storm-TenantID"] as string) || "";
}

export function generateUuid(): string {
  return uuidv4();
}

export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Helper function to hash password with scrypt
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
};

// Helper function to verify password with scrypt
export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  const [saltHex, keyHex] = hashedPassword.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(keyHex, "hex");

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(storedKey, derivedKey);
};

// Function to hash the reset token
export const hashResetToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.storm_app_token;
    if (!token) {
      return res.status(401).send("Authentication required");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    if (decoded.role !== "admin") {
      return res.status(403).send("Admin access required");
    }

    // Add user to request object
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(401).send("Invalid token");
  }
};
