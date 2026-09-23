import swaggerAutogen from "swagger-autogen";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "node:fs";
import { ZodObject } from "zod";

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
import {
  StartWordMatchingSchema,
  SubmitWordMatchingSchema,
  SaveWordMatchingProgressSchema,
} from "./module/word-matching/word-matching.schema.js";
import { GradeEssaySchema } from "./module/AI/ai.schema.js";
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

// Danh sách các Router kèm Base Path tương ứng trong app.ts
const routeModules: { prefix: string; file: string; defaultTag?: string }[] = [
  { prefix: "/api/auth", file: "./src/module/auth/auth.route.ts", defaultTag: "Auth" },
  { prefix: "/api/admin/students", file: "./src/module/StudentManage/studenManage.route.ts", defaultTag: "Admin - Students" },
  { prefix: "/api/admin/dashboard", file: "./src/module/dashboard/dashboard.route.ts", defaultTag: "Admin - Dashboard" },
  { prefix: "/api/admin/logs", file: "./src/module/activity-log/activity-log.route.ts", defaultTag: "Admin - Logs" },
  { prefix: "/api/admin/word", file: "./src/module/word/word.route.ts", defaultTag: "Admin - Words" },
  { prefix: "/api/admin/courses", file: "./src/module/course/course.route.ts", defaultTag: "Admin - Courses" },
  { prefix: "/api/admin/topics", file: "./src/module/topic/topic.route.ts", defaultTag: "Admin - Topics" },
  { prefix: "/api/admin/achievements", file: "./src/module/achievement/achievement.route.ts", defaultTag: "Admin - Achievements" },
  { prefix: "/api/admin/tests", file: "./src/module/test/test.route.ts", defaultTag: "Admin - Tests" },
  { prefix: "/game/bubble-game", file: "./src/module/bubble-game/bubble-game.route.ts", defaultTag: "Game - Bubble Game" },
  { prefix: "/game/memory-card", file: "./src/module/memory-card/memory-card.route.ts", defaultTag: "Game - Memory Card" },
  { prefix: "/game/word-matching", file: "./src/module/word-matching/word-matching.route.ts", defaultTag: "Game - Word Matching" },
  { prefix: "/api/ai", file: "./src/module/AI/ai.router.ts", defaultTag: "AI" },
];

const autogen = (swaggerAutogen as any).default || swaggerAutogen;

/**
 * Tự động phân loại Tag dựa trên đường dẫn URL
 */
function getAutoTag(path: string): string {
  const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = cleanPath.split("/");

  if (segments[0] === "api" && segments[1] === "auth") return "Auth";
  if (segments[0] === "api" && segments[1] === "ai") return "AI";
  if (segments[0] === "api" && segments[1] === "admin" && segments[2]) {
    const rawModule = segments[2];
    const moduleMap: Record<string, string> = {
      students: "Admin - Students",
      word: "Admin - Words",
      courses: "Admin - Courses",
      lessons: "Admin - Courses",
      topics: "Admin - Topics",
      tests: "Admin - Tests",
      achievements: "Admin - Achievements",
      logs: "Admin - Logs",
      dashboard: "Admin - Dashboard",
    };
    if (moduleMap[rawModule.toLowerCase()]) {
      return moduleMap[rawModule.toLowerCase()];
    }
    return `Admin - ${rawModule.charAt(0).toUpperCase() + rawModule.slice(1)}`;
  }

  if (segments[0] === "game" && segments[1]) {
    const gameName = segments[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `Game - ${gameName}`;
  }

  if (segments[0] === "api" && segments[1]) {
    return segments[1].charAt(0).toUpperCase() + segments[1].slice(1);
  }

  const fallback = segments[0] || "General";
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

function getAutoSummary(path: string, method: string): string {
  const upperMethod = method.toUpperCase();
  const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = cleanPath.split("/");
  const lastSegment = segments[segments.length - 1] || "";

  if (lastSegment.startsWith("total")) return `Thống kê ${lastSegment}`;
  if (lastSegment === "restore") return `Khôi phục bản ghi đã xóa`;
  if (lastSegment === "grade-essay") return `Chấm điểm bài viết (Writing)`;
  if (lastSegment === "grade-speaking") return `Chấm điểm bài nói (Speaking)`;
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

async function generate() {
  const mergedPaths: Record<string, any> = {};

  // 1. Quét từng Router và gộp kết quả với đúng URL Prefix
  for (let i = 0; i < routeModules.length; i++) {
    const mod = routeModules[i];
    if (!fs.existsSync(mod.file)) continue;

    const tempOutputFile = `./src/swagger-temp-${i}.json`;
    try {
      await autogen({ openapi: "3.0.0" })(tempOutputFile, [mod.file], doc);
      if (fs.existsSync(tempOutputFile)) {
        const tempContent = JSON.parse(fs.readFileSync(tempOutputFile, "utf8"));
        if (tempContent.paths) {
          for (const [rawPath, pathItem] of Object.entries(tempContent.paths)) {
            let cleanSubPath = rawPath.replace(/\/+$/, "");
            if (!cleanSubPath.startsWith("/")) cleanSubPath = "/" + cleanSubPath;
            if (cleanSubPath === "/") cleanSubPath = "";

            let cleanPrefix = mod.prefix.replace(/\/+$/, "");
            if (!cleanPrefix.startsWith("/")) cleanPrefix = "/" + cleanPrefix;

            let fullPath = `${cleanPrefix}${cleanSubPath}`;
            if (!fullPath) fullPath = "/";

            mergedPaths[fullPath] = pathItem;
          }
        }
        fs.unlinkSync(tempOutputFile);
      }
    } catch (_e) {
      if (fs.existsSync(tempOutputFile)) fs.unlinkSync(tempOutputFile);
    }
  }

  const finalSwaggerDoc: any = {
    ...doc,
    openapi: "3.0.0",
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
    paths: mergedPaths,
  };

  // 2. Cấu hình Schema & Summary chi tiết cho từng API
  const courseEndpoints = {
    get: { schema: GetCoursesQuerySchema, summary: "Lấy danh sách khóa học (phân trang, lọc cefrLevel, tìm kiếm)", tags: ["Admin - Courses"] },
    post: { schema: CreateCourseSchema, summary: "Tạo khóa học mới (kèm danh sách từ vựng)", tags: ["Admin - Courses"] },
  };

  const courseIdEndpoints = {
    get: { schema: CourseIdParamSchema, summary: "Xem chi tiết khóa học & danh sách từ vựng", tags: ["Admin - Courses"] },
    put: { schema: UpdateCourseSchema, summary: "Cập nhật thông tin khóa học", tags: ["Admin - Courses"] },
    delete: { schema: CourseIdParamSchema, summary: "Xóa mềm khóa học (Soft Delete)", tags: ["Admin - Courses"] },
  };

  const routeSchemaMap: Record<string, Record<string, { schema?: any; summary?: string; tags?: string[]; requestBody?: any }>> = {
    "/api/auth/register": { post: { schema: RegisterSchema, summary: "Đăng ký tài khoản mới", tags: ["Auth"] } },
    "/api/auth/login": { post: { schema: LoginSchema, summary: "Đăng nhập với email/username & password", tags: ["Auth"] } },
    "/api/auth/logout": { post: { schema: LogoutSchema, summary: "Đăng xuất tài khoản & hủy refresh token", tags: ["Auth"] } },
    "/api/auth/refresh": { post: { schema: RefreshTokenSChema, summary: "Cấp lại Access Token mới", tags: ["Auth"] } },
    "/api/auth/google": { post: { schema: GoogleLoginSchema, summary: "Đăng nhập với Google ID Token", tags: ["Auth"] } },
    "/api/auth/facebook": { post: { schema: FacebookLoginSchema, summary: "Đăng nhập với Facebook Access Token", tags: ["Auth"] } },
    "/api/admin/students": { get: { schema: GetStudentQuerySchema, summary: "Lấy danh sách học viên (phân trang, tìm kiếm)", tags: ["Admin - Students"] } },
    "/api/admin/students/totalStudent": { get: { summary: "Thống kê tổng số học viên", tags: ["Admin - Students"] } },
    "/api/admin/students/{id}": { get: { schema: StudentIdParamSchema, summary: "Xem chi tiết học viên & tiến trình học", tags: ["Admin - Students"] } },
    "/api/admin/word/totalWord": { get: { summary: "Thống kê tổng số từ vựng", tags: ["Admin - Words"] } },
    "/api/admin/word": {
      get: { schema: { shape: { query: getWordsQuerySchema } }, summary: "Lấy danh sách từ vựng", tags: ["Admin - Words"] },
      post: { schema: createWordSchema, summary: "Thêm từ vựng mới", tags: ["Admin - Words"] },
    },
    "/api/admin/word/{id}": {
      put: { schema: updateWordSchema, summary: "Cập nhật từ vựng", tags: ["Admin - Words"] },
      delete: { summary: "Xóa từ vựng", tags: ["Admin - Words"] },
    },
    "/api/admin/courses/totalLesson": { get: { summary: "Thống kê tổng số bài học / khóa học", tags: ["Admin - Courses"] } },
    "/api/admin/courses/totalCourse": { get: { summary: "Thống kê tổng số khóa học", tags: ["Admin - Courses"] } },
    "/api/admin/courses": courseEndpoints,
    "/api/admin/courses/{id}": courseIdEndpoints,
    "/api/admin/courses/{id}/restore": { patch: { schema: CourseIdParamSchema, summary: "Khôi phục khóa học đã xóa mềm", tags: ["Admin - Courses"] } },
    "/api/admin/courses/{id}/words": { post: { schema: AddWordsToCourseSchema, summary: "Gán thêm danh sách từ vựng vào khóa học", tags: ["Admin - Courses"] } },
    "/api/admin/courses/{id}/words/{wordId}": { delete: { schema: CourseWordParamSchema, summary: "Gỡ từ vựng ra khỏi khóa học", tags: ["Admin - Courses"] } },
    "/game/bubble-game/start": { get: { schema: StartGameSchema, summary: "Bắt đầu game Bubble (lấy danh sách từ vựng)", tags: ["Game - Bubble Game"] } },
    "/game/bubble-game/match": { post: { schema: MatchPairSchema, summary: "Ghi nhận cặp từ ghép đúng trong Bubble Game", tags: ["Game - Bubble Game"] } },
    "/game/bubble-game/finish": { post: { schema: FinishGameSchema, summary: "Hoàn tất ván chơi Bubble Game", tags: ["Game - Bubble Game"] } },
    "/game/memory-card/start": { get: { schema: StartMemoryGameSchema, summary: "Bắt đầu game Memory Card (lấy danh sách thẻ)", tags: ["Game - Memory Card"] } },
    "/game/memory-card/progress": { post: { schema: SaveProgressSchema, summary: "Lưu tiến trình tạm thời game Memory Card", tags: ["Game - Memory Card"] } },
    "/game/memory-card/finish": { post: { schema: FinishMemoryGameSchema, summary: "Hoàn tất ván chơi Memory Card", tags: ["Game - Memory Card"] } },
    "/game/word-matching/start": { get: { schema: StartWordMatchingSchema, summary: "Bắt đầu game Nối từ (lấy danh sách 2 cột A & B)", tags: ["Game - Word Matching"] } },
    "/game/word-matching/submit": { post: { schema: SubmitWordMatchingSchema, summary: "Xác nhận nộp bài nối từ & chấm điểm", tags: ["Game - Word Matching"] } },
    "/game/word-matching/progress": { post: { schema: SaveWordMatchingProgressSchema, summary: "Lưu tiến trình tạm thời game Nối từ", tags: ["Game - Word Matching"] } },
    "/api/ai/grade-essay": { post: { schema: GradeEssaySchema, summary: "Chấm điểm bài viết (Writing)", tags: ["AI"] } },
    "/api/ai/grade-speaking": {
      post: {
        summary: "Chấm điểm bài nói (Speaking qua File Audio ghi âm)",
        tags: ["AI"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  audio: {
                    type: "string",
                    format: "binary",
                    description: "File âm thanh ghi âm (.mp3, .wav, .m4a, .webm)",
                  },
                  topic: {
                    type: "string",
                    description: "Chủ đề bài nói (tùy chọn)",
                    example: "Describe your favorite hobby",
                  },
                  targetSentence: {
                    type: "string",
                    description: "Câu mẫu yêu cầu đọc theo (tùy chọn nếu là bài đọc theo mẫu)",
                    example: "I usually get up at around 6:30 in the morning.",
                  },
                },
                required: ["audio"],
              },
            },
          },
        },
      },
    },
  };

  // 3. Áp dụng schema chi tiết từ routeSchemaMap
  for (const [path, methods] of Object.entries(routeSchemaMap)) {
    const matchedPath = finalSwaggerDoc.paths[path] ? path : finalSwaggerDoc.paths[`${path}/`] ? `${path}/` : path;
    if (!finalSwaggerDoc.paths[matchedPath]) {
      finalSwaggerDoc.paths[matchedPath] = {};
    }

    for (const [method, config] of Object.entries(methods)) {
      if (!finalSwaggerDoc.paths[matchedPath][method]) {
        finalSwaggerDoc.paths[matchedPath][method] = { responses: { "200": { description: "OK" } } };
      }

      const op = finalSwaggerDoc.paths[matchedPath][method];
      if (config.summary) op.summary = config.summary;
      if (config.tags) op.tags = config.tags;
      if ((config as any).requestBody) op.requestBody = (config as any).requestBody;

      if (config.schema) {
        const { parameters, requestBody } = extractParametersAndBody(config.schema);
        if (parameters.length > 0) {
          op.parameters = parameters;
        }
        if (requestBody && !(config as any).requestBody) {
          op.requestBody = requestBody;
        }
      }
    }
  }

  // 4. Tự động gắn tag và summary cho tất cả các endpoint còn lại
  for (const [pathKey, pathItem] of Object.entries(finalSwaggerDoc.paths)) {
    const methods = pathItem as Record<string, any>;
    for (const [method, op] of Object.entries(methods)) {
      if (typeof op !== "object" || !op) continue;

      if (!op.tags || op.tags.length === 0) {
        op.tags = [getAutoTag(pathKey)];
      }
      if (!op.summary) {
        op.summary = getAutoSummary(pathKey, method);
      }
      if (Array.isArray(op.parameters)) {
        op.parameters = op.parameters.filter(
          (p: any) => p.in !== "body" && p.in !== "header"
        );
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(finalSwaggerDoc, null, 2), "utf8");
  console.log("✨ Swagger documentation generated successfully!");
}

generate();
