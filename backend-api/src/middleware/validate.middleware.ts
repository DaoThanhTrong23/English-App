import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => { 
    return async (req: Request, res: Response, _next: NextFunction) => {
        try {
            //Validate cả body json, query và params dồng thời
            const validate = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            // Gán lại dữ liệu đã làm sach
            req.body = validate.body;
            req.query = validate.query;
            req.params = validate.params;

            return _next();
        } catch (error) {
            //Global exception handler sẽ xử lý trả lỗi khi validate thất bại
            return _next(error);
        }
    }
}