// src/config/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "English Learning App API Documentation",
      version: "1.0.0",
      description: "Tài liệu API Backend cho ứng dụng học tiếng Anh",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Nhập Access Token vào đây theo dạng: Bearer <token>",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // Đường dẫn đến các file chứa chú thích Swagger
  apis: ["./src/module/**/*.route.ts", "./src/module/**/*.schema.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);