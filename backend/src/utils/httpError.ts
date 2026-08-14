export type ValidationErrors = {
    field: string | number,
    message: string
}



export class HttpError extends Error {
    readonly statusCode: number;
    readonly errors?: ValidationErrors[];

    constructor(message: string, statusCode: number, errors?: ValidationErrors[]) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
    }
}

export const httpError = (message: string, statusCode: number): HttpError =>
    new HttpError(message, statusCode);

export const notFound = (message: string): HttpError => new HttpError(message, 404);

export const badRequest = (message: string): HttpError => new HttpError(message, 400);

export const conflict = (message: string): HttpError => new HttpError(message, 409);

export const unauthorized = (message: string): HttpError => new HttpError(message, 401);

export const forbidden = (message: string): HttpError => new HttpError(message, 403);

// Joining the objects directly would stringify each one as "[object Object]",
// so the top-level message is built from the messages alone.
export const validationFailed = (errors: ValidationErrors[]): HttpError =>
    new HttpError(errors.map(error => error.message).join(" "), 400, errors);
