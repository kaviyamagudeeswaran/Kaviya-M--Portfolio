import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface JwtPayloadData {
  userId: string;
  role: string;
  email: string;
  name: string;
}

const getCurrentAuthUser = (): RequestHandler => {
  const handler: RequestHandler = async (req, res, next) => {
    const token = req.cookies?.storm_app_token;
    if (!token) {
      return res.status(401).send();
    }

    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
      ) as unknown as JwtPayloadData;

      return res.status(200).json({
        id: decoded.userId,
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
      });
    } catch (error) {
      return res.status(401).redirect("/login.html");
    }
  };
  return handler;
};

export default getCurrentAuthUser;
