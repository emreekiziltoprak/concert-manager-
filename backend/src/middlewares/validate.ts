import {Request, Response, NextFunction} from 'express';
import {ZodObject, ZodError} from 'zod';
import { validationFailed } from '../utils/httpError';

export const validateResponse = (schema: ZodObject) =>
(req: Request, res: Response, next: NextFunction) => 
    {

        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        }
        catch(error){
            if(error instanceof ZodError){
                let errorToForward = error.issues.map(errorObj => ({field: errorObj.path.slice(1).join("."), message: errorObj.message }));
                next(validationFailed(errorToForward));
                return;
            }
            next(error);
        }

}