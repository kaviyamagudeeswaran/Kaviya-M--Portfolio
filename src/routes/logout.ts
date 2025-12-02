import { Request, Response } from "express";
export const logout = (req: Request, res: Response) => {
  res.clearCookie("storm_app_token");
  res.redirect("/login.html");
};
