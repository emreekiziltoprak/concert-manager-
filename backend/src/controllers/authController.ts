import type { Request, Response } from "express";
import * as authService from "../services/authService";
import { errorMessage } from "../utils/errorMessage";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";

const register = async (req: Request<{}, {}, RegisterInput>, res: Response) => {

    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    }
    catch(e) {
        res.status(400).json({error: errorMessage(e)});
    }
}

const login = async (req: Request<{},{}, LoginInput>, res: Response) => {
    try{
        const successResult = await authService.login(req.body);
        res.status(200).json(successResult);
    } catch(e){
        res.status(400).json({error: errorMessage(e)});
    }
}

export {login, register};
