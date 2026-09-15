export class ApiError extends Error {
    statuscode;
    code;
    constructor(statuscode, code, message) {
        super(message);
        this.statuscode = statuscode;
        this.code = code;
    }
}
