import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { WithId, Document } from "mongodb";
import { database } from "../utils/database";
import { verifyPassword } from "../utils/auth";

export interface User extends WithId<Document> {
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = await database.getDb();

  try {
    const user = await db.collection<User>("auth_users").findOne({ email });

    if (!user) {
      return res.status(400).send("Invalid credentials");
    }

    const isMatch = await verifyPassword(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const JWT_SECRET: string = process.env.JWT_SECRET;

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("storm_app_token", token, { path: "/", httpOnly: false });
    return res.status(200).send({
      token: token,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send(error);
  }
};
