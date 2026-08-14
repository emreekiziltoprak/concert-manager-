import type { Request, Response } from "express";
import * as userService from '../services/usersService';
import { requireUser } from '../utils/requireUser';


const getUserProfile = async (req: Request, res: Response) => {
  console.log("get user p")

  try {
    // Left inside the try deliberately. requireUser throws a 401, but this
    // catch already answers 500 for anything that goes wrong here -- which is
    // exactly what the old `req.user.userId` TypeError produced -- so keeping it
    // here preserves the current response rather than quietly changing it.
    const userId = requireUser(req).userId;
    const userProfileInformation = await userService.getUserProfile(userId);
    res.status(200).json(userProfileInformation);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.  status(500).json({ error: "User info cant be fetched." });
  }
};

export {getUserProfile}
