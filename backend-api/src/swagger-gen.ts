import swaggerAutogen from "swagger-autogen";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "node:fs";
import { ZodObject, ZodSchema } from "zod";

// Import all schemas
import {
  RegisterSchema,
  LoginSchema,
  LogoutSchema,
  RefreshTokenSChema,
  GoogleLoginSchema,
  FacebookLoginSchema,
} from "./module/auth/auth.schema.js";
import {
  GetStudentQuerySchema,
  StudentIdParamSchema,
} from "./module/StudentManage/studentManage.schema.js";
import {
  getWordsQuerySchema,
  createWordSchema,
  updateWordSchema,
} from "./module/word/word.schema.js";
import {
  GetCoursesQuerySchema,
  CourseIdParamSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  AddWordsToCourseSchema,
  CourseWordParamSchema,
} from "./module/course/course.schema.js";
import {
  StartGameSchema,
  MatchPairSchema,
  FinishGameSchema,
} from "./module/bubble-game/bubble-game.schema.js";
import {
  StartMemoryGameSchema,
  SaveProgressSchema,
  FinishMemoryGameSchema,
} from "./module/memory-card/memory-card.schema.js";
import { env } from "./config/env.js";

const doc = {
  openapi: "3.0.0",
  info: {
    title: "English Learning App API Documentation",
    description: "Tài liệu API Backend tự động sinh từ Express Router & Zod Schemas",
    version: "1.0.0",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT || 3000}`,
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
};

const outputFile = "./src/swagger-output.json";
const endpointsFiles = ["./src/app.ts"];

const autogen = (swaggerAutogen as any).default || swaggerAutogen;

function extractParametersAndBody(schemaWrapper: any) {
  const parameters: any[] = [];
  let requestBody: any = undefined;

  if (!schemaWrapper) return { parameters, requestBody };

  // 1. Query parameters
  if (schemaWrapper.shape?.query) {
    const querySchema: any = zodToJsonSchema(schemaWrapper.shape.query, { target: "openApi3" });
    if (querySchema.properties) {
      for (const [key, prop] of Object.entries(querySchema.properties)) {
        parameters.push({
          name: key,
          in: "query",
          required: querySchema.required?.includes(key) || false,
          schema: prop,
          description: (prop as any).description || `Tham số query ${key}`,
        });
      }
    }
  }

  // 2. Path parameters
  if (schemaWrapper.shape?.params) {
    const paramsSchema: any = zodToJsonSchema(schemaWrapper.shape.params, { target: "openApi3" });
    if (paramsSchema.properties) {
      for (const [key, prop] of Object.entries(paramsSchema.properties)) {
        parameters.push({
          name: key,
          in: "path",
          required: true,
          schema: prop,
          description: (prop as any).description || `Tham số param ${key}`,
        });
      }
    }
  }

  // 3. Request Body (JSON)
  if (schemaWrapper.shape?.body) {
    const bodySchema: any = zodToJsonSchema(schemaWrapper.shape.body, { target: "openApi3" });
    if (bodySchema.properties && Object.keys(bodySchema.properties).length > 0) {
      requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: bodySchema,
          },
        },
      };
    }
  } else if (schemaWrapper instanceof ZodObject && !schemaWrapper.shape?.body && !schemaWrapper.shape?.query) {
    // For schemas like createWordSchema / updateWordSchema which directly represent body
    const bodySchema: any = zodToJsonSchema(schemaWrapper, { target: "openApi3" });
    if (bodySchema.properties && Object.keys(bodySchema.properties).length > 0) {
      requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: bodySchema,
          },
        },
      };
    }
  }

  return { parameters, requestBody };
}

// Chạy swagger-autogen với OpenAPI 3.0
await autogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);

// Đọc lại file json vừa sinh và enrich dữ liệu chi tiết từ Zod Schemas
if (fs.existsSync(outputFile)) {
  const swaggerDoc = JSON.parse(fs.readFileSync(outputFile, "utf8"));

  // Đảm bảo đúng chuẩn OpenAPI 3.0
  swaggerDoc.openapi = "3.0.0";
  delete swaggerDoc.swagger;
  delete swaggerDoc.host;
  delete swaggerDoc.basePath;
  delete swaggerDoc.schemes;
  swaggerDoc.servers = [
    {
      url: `http://localhost:${env.PORT || 3000}`,
      description: "Development Server",
    },
  ];

  if (!swaggerDoc.components) swaggerDoc.components = {};
  swaggerDoc.components.securitySchemes = {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Nhập Access Token vào đây theo dạng: Bearer <token>",
    },
  };

  const routeSchemaMap: Record<string, Record<string, { schema?: any; summary: string; tags: string[] }>> = {
    "/api/auth/register": {
      post: { schema: RegisterSchema, summary: "Đăng ký tài khoản mới", tags: ["Auth"] },
    },
    "/api/auth/login": {
      post: { schema: LoginSchema, summary: "Đăng nhập với email/username & password", tags: ["Auth"] },
    },
    "/api/auth/logout": {
      post: { schema: LogoutSchema, summary: "Đăng xuất tài khoản & hủy refresh token", tags: ["Auth"] },
    },
    "/api/auth/refresh": {
      post: { schema: RefreshTokenSChema, summary: "Cấp lại Access Token mới", tags: ["Auth"] },
    },
    "/api/auth/google": {
      post: { schema: GoogleLoginSchema, summary: "Đăng nhập với Google ID Token", tags: ["Auth"] },
    },
    "/api/auth/facebook": {
      post: { schema: FacebookLoginSchema, summary: "Đăng nhập với Facebook Access Token", tags: ["Auth"] },
    },
    "/api/admin/students": {
      get: { schema: GetStudentQuerySchema, summary: "Lấy danh sách học viên (phân trang, tìm kiếm)", tags: ["Admin - Students"] },
    },
    "/api/admin/students/totalStudent": {
      get: { summary: "Thống kê tổng số học viên", tags: ["Admin - Students"] },
    },
    "/api/admin/students/{id}": {
      get: { schema: StudentIdParamSchema, summary: "Xem chi tiết học viên & tiến trình học", tags: ["Admin - Students"] },
    },
    "/api/admin/word/totalWord": {
      get: { summary: "Thống kê tổng số từ vựng", tags: ["Admin - Words"] },
    },
    "/api/admin/word": {
      get: { schema: { shape: { query: getWordsQuerySchema } }, summary: "Lấy danh sách từ vựng", tags: ["Admin - Words"] },
      post: { schema: createWordSchema, summary: "Thêm từ vựng mới", tags: ["Admin - Words"] },
    },
    "/api/admin/word/{id}": {
      put: { schema: updateWordSchema, summary: "Cập nhật từ vựng", tags: ["Admin - Words"] },
      delete: { summary: "Xóa từ vựng", tags: ["Admin - Words"] },
    },
    "/api/admin/courses/totalLesson": {
      get: { summary: "Thống kê tổng số bài học / khóa học", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/totalCourse": {
      get: { summary: "Thống kê tổng số khóa học", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses": {
      get: { schema: GetCoursesQuerySchema, summary: "Lấy danh sách khóa học (phân trang, lọc cefrLevel, tìm kiếm)", tags: ["Admin - Courses"] },
      post: { schema: CreateCourseSchema, summary: "Tạo khóa học mới (kèm danh sách từ vựng)", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/{id}": {
      get: { schema: CourseIdParamSchema, summary: "Xem chi tiết khóa học & danh sách từ vựng", tags: ["Admin - Courses"] },
      put: { schema: UpdateCourseSchema, summary: "Cập nhật thông tin khóa học", tags: ["Admin - Courses"] },
      delete: { schema: CourseIdParamSchema, summary: "Xóa mềm khóa học (Soft Delete)", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/{id}/restore": {
      patch: { schema: CourseIdParamSchema, summary: "Khôi phục khóa học đã xóa mềm", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/{id}/words": {
      post: { schema: AddWordsToCourseSchema, summary: "Gán thêm danh sách từ vựng vào khóa học", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/{id}/words/{wordId}": {
      delete: { schema: CourseWordParamSchema, summary: "Gỡ từ vựng ra khỏi khóa học", tags: ["Admin - Courses"] },
    },
    "/game/bubble-game/start": {
      get: { schema: StartGameSchema, summary: "Bắt đầu game Bubble (lấy danh sách từ vựng)", tags: ["Game - Bubble"] },
    },
    "/game/bubble-game/match": {
      post: { schema: MatchPairSchema, summary: "Ghi nhận cặp từ ghép đúng trong Bubble Game", tags: ["Game - Bubble"] },
    },
    "/game/bubble-game/finish": {
      post: { schema: FinishGameSchema, summary: "Hoàn tất ván chơi Bubble Game", tags: ["Game - Bubble"] },
    },
    "/game/memory-card/start": {
      get: { schema: StartMemoryGameSchema, summary: "Bắt đầu game Memory Card (lấy danh sách thẻ)", tags: ["Game - Memory Card"] },
    },
    "/game/memory-card/progress": {
      post: { schema: SaveProgressSchema, summary: "Lưu tiến trình tạm thời game Memory Card", tags: ["Game - Memory Card"] },
    },
    "/game/memory-card/finish": {
      post: { schema: FinishMemoryGameSchema, summary: "Hoàn tất ván chơi Memory Card", tags: ["Game - Memory Card"] },
    },
  };

  // Map into swaggerDoc.paths
  for (const [path, methods] of Object.entries(routeSchemaMap)) {
    // Check normalize path (e.g. trailing slash)
    const matchedPath = swaggerDoc.paths[path] ? path : swaggerDoc.paths[`${path}/`] ? `${path}/` : path;
    if (!swaggerDoc.paths[matchedPath]) {
      swaggerDoc.paths[matchedPath] = {};
    }

    for (const [method, config] of Object.entries(methods)) {
      if (!swaggerDoc.paths[matchedPath][method]) {
        swaggerDoc.paths[matchedPath][method] = { responses: { "200": { description: "OK" } } };
      }

      const op = swaggerDoc.paths[matchedPath][method];
      op.summary = config.summary;
      op.tags = config.tags;

      if (config.schema) {
        const { parameters, requestBody } = extractParametersAndBody(config.schema);
        if (parameters.length > 0) {
          op.parameters = parameters;
        } else {
          // Xóa các parameters header/body tự động sinh sai
          op.parameters = (op.parameters || []).filter((p: any) => p.in !== "body" && p.in !== "header");
        }
        if (requestBody) {
          op.requestBody = requestBody;
        }
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2), "utf8");
  console.log("✨ OpenAPI 3.0 documentation with full JSON Request Body schemas generated successfully!");
}
