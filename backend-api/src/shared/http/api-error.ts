export class ApiError extends Error {
    constructor(
        public readonly statuscode:number,
        public readonly code:string,
        message:string
    ) {
        super(message);
    }
}