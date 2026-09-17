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

/**
 * Tự động phân loại Tag (Mục lớn trên Swagger UI) dựa trên đường dẫn URL
 */
function getAutoTag(path: string): string {
  const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = cleanPath.split("/");

  // 1. /api/auth/... -> "Auth"
  if (segments[0] === "api" && segments[1] === "auth") {
    return "Auth";
  }

  // 2. /api/admin/<module>/... -> "Admin - <Capitalized Module>"
  if (segments[0] === "api" && segments[1] === "admin" && segments[2]) {
    const rawModule = segments[2];
    const moduleMap: Record<string, string> = {
      students: "Admin - Students",
      student: "Admin - Students",
      word: "Admin - Words",
      words: "Admin - Words",
      courses: "Admin - Courses",
      course: "Admin - Courses",
      lessons: "Admin - Courses",
      lesson: "Admin - Courses",
      tests: "Admin - Tests",
      test: "Admin - Tests",
      achievements: "Admin - Achievements",
      achievement: "Admin - Achievements",
      logs: "Admin - Logs",
    };
    if (moduleMap[rawModule.toLowerCase()]) {
      return moduleMap[rawModule.toLowerCase()];
    }
    return `Admin - ${rawModule.charAt(0).toUpperCase() + rawModule.slice(1)}`;
  }

  // 3. /game/<game-name>/... -> "Game - <Game Name>"
  if (segments[0] === "game" && segments[1]) {
    const gameName = segments[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `Game - ${gameName}`;
  }

  // 4. /api/<module>/... -> "<Module>"
  if (segments[0] === "api" && segments[1]) {
    const mod = segments[1].charAt(0).toUpperCase() + segments[1].slice(1);
    return mod;
  }

  const fallback = segments[0] || "General";
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

/**
 * Tự động tạo tóm tắt (Summary) nếu chưa được đặt thủ công
 */
function getAutoSummary(path: string, method: string): string {
  const upperMethod = method.toUpperCase();
  const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = cleanPath.split("/");
  const lastSegment = segments[segments.length - 1] || "";

  if (lastSegment.startsWith("total")) {
    return `Thống kê ${lastSegment}`;
  }
  if (lastSegment === "restore") {
    return `Khôi phục bản ghi đã xóa`;
  }
  if (lastSegment.startsWith("{") && lastSegment.endsWith("}")) {
    if (upperMethod === "GET") return `Xem chi tiết theo ID`;
    if (upperMethod === "PUT") return `Cập nhật theo ID`;
    if (upperMethod === "DELETE") return `Xóa theo ID`;
    if (upperMethod === "PATCH") return `Cập nhật một phần theo ID`;
  }

  if (upperMethod === "GET") return `Lấy danh sách`;
  if (upperMethod === "POST") return `Tạo mới`;
  if (upperMethod === "PUT") return `Cập nhật`;
  if (upperMethod === "DELETE") return `Xóa`;

  return `[${upperMethod}] ${path}`;
}

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

// Đọc lại file json vừa sinh và enrich dữ liệu chi tiết
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

  // Schema mappings có cấu hình chi tiết
  const courseEndpoints = {
    get: { schema: GetCoursesQuerySchema, summary: "Lấy danh sách khóa học (phân trang, lọc cefrLevel, tìm kiếm)", tags: ["Admin - Courses"] },
    post: { schema: CreateCourseSchema, summary: "Tạo khóa học mới (kèm danh sách từ vựng)", tags: ["Admin - Courses"] },
  };

  const courseIdEndpoints = {
    get: { schema: CourseIdParamSchema, summary: "Xem chi tiết khóa học & danh sách từ vựng", tags: ["Admin - Courses"] },
    put: { schema: UpdateCourseSchema, summary: "Cập nhật thông tin khóa học", tags: ["Admin - Courses"] },
    delete: { schema: CourseIdParamSchema, summary: "Xóa mềm khóa học (Soft Delete)", tags: ["Admin - Courses"] },
  };

  const routeSchemaMap: Record<string, Record<string, { schema?: any; summary?: string; tags?: string[] }>> = {
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
    "/api/admin/courses": courseEndpoints,
    "/api/admin/courses/{id}": courseIdEndpoints,
    "/api/admin/courses/{id}/restore": {
      patch: { schema: CourseIdParamSchema, summary: "Khôi phục khóa học đã xóa mềm", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/{id}/words": {
      post: { schema: AddWordsToCourseSchema, summary: "Gán thêm danh sách từ vựng vào khóa học", tags: ["Admin - Courses"] },
    },
    "/api/admin/courses/{id}/words/{wordId}": {
      delete: { schema: CourseWordParamSchema, summary: "Gỡ từ vựng ra khỏi khóa học", tags: ["Admin - Courses"] },
    },
    "/api/admin/lessons": courseEndpoints,
    "/api/admin/lessons/{id}": courseIdEndpoints,
    "/api/admin/lessons/totalLesson": {
      get: { summary: "Thống kê tổng số bài học / khóa học", tags: ["Admin - Courses"] },
    },
    "/game/bubble-game/start": {
      get: { schema: StartGameSchema, summary: "Bắt đầu game Bubble (lấy danh sách từ vựng)", tags: ["Game - Bubble Game"] },
    },
    "/game/bubble-game/match": {
      post: { schema: MatchPairSchema, summary: "Ghi nhận cặp từ ghép đúng trong Bubble Game", tags: ["Game - Bubble Game"] },
    },
    "/game/bubble-game/finish": {
      post: { schema: FinishGameSchema, summary: "Hoàn tất ván chơi Bubble Game", tags: ["Game - Bubble Game"] },
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

  // 1. Áp dụng cấu hình cụ thể từ routeSchemaMap
  for (const [path, methods] of Object.entries(routeSchemaMap)) {
    const matchedPath = swaggerDoc.paths[path] ? path : swaggerDoc.paths[`${path}/`] ? `${path}/` : path;
    if (!swaggerDoc.paths[matchedPath]) {
      swaggerDoc.paths[matchedPath] = {};
    }

    for (const [method, config] of Object.entries(methods)) {
      if (!swaggerDoc.paths[matchedPath][method]) {
        swaggerDoc.paths[matchedPath][method] = { responses: { "200": { description: "OK" } } };
      }

      const op = swaggerDoc.paths[matchedPath][method];
      if (config.summary) op.summary = config.summary;
      if (config.tags) op.tags = config.tags;

      if (config.schema) {
        const { parameters, requestBody } = extractParametersAndBody(config.schema);
        if (parameters.length > 0) {
          op.parameters = parameters;
        } else {
          op.parameters = (op.parameters || []).filter((p: any) => p.in !== "body" && p.in !== "header");
        }
        if (requestBody) {
          op.requestBody = requestBody;
        }
      }
    }
  }

  // 2. TỰ ĐỘNG CHIA MỤC (TAGS) & TỰ ĐỘNG GẮN SUMMARY CHO TẤT CẢ CÁC API MỚI QUÉT ĐƯỢC
  for (const [pathKey, pathItem] of Object.entries(swaggerDoc.paths)) {
    const methods = pathItem as Record<string, any>;
    for (const [method, op] of Object.entries(methods)) {
      if (typeof op !== "object" || !op) continue;

      // Nếu API mới chưa có Tag -> Tự động sinh Tag theo URL (Auth, Admin - Tests, Game - xyz...)
      if (!op.tags || op.tags.length === 0) {
        op.tags = [getAutoTag(pathKey)];
      }

      // Nếu API mới chưa có Summary -> Tự động sinh Summary
      if (!op.summary) {
        op.summary = getAutoSummary(pathKey, method);
      }

      // Xóa bỏ parameters body/header rác nếu có
      if (Array.isArray(op.parameters)) {
        op.parameters = op.parameters.filter(
          (p: any) => p.in !== "body" && p.in !== "header"
        );
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2), "utf8");
  console.log("✨ Swagger documentation with Auto-Grouping (Auto-Tags) generated successfully!");
}
