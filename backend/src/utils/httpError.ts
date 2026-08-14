export class HttpError extends Error {
    readonly statusCode: number;
    readonly errors?: string[];

    constructor(message: string, statusCode: number, errors?: string[]) {
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

export const validationFailed = (errors: string[]): HttpError =>
    new HttpError(errors.join(" "), 400, errors);
