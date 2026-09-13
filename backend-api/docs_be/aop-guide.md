# 🌀 Hướng Dẫn Sử Dụng & Thiết Kế AOP (Aspect-Oriented Programming) trong Backend API

Tài liệu này hướng dẫn chi tiết về kiến trúc **AOP (Lập trình hướng khía cạnh)**, cách sử dụng các **Decorators** có sẵn và quy chuẩn thiết kế Decorator mới trong dự án `backend-api`.

---

## 📌 1. Tổng Quan về AOP (Aspect-Oriented Programming)

### 1.1. Vấn đề Cross-Cutting Concerns
Trong lập trình truyền thống (OOP), các tác vụ phụ trợ như **Ghi log thực thi (System Logging)**, **Ghi vết hành vi người dùng (Activity Logging)**, **Đo lường hiệu năng (Performance Audit)** thường bị rải rác lặp đi lặp lại ở khắp các Service:

```typescript
// ❌ KHÔNG DÙNG AOP: Code nghiệp vụ bị "ô nhiễm" bởi code phụ trợ
async finishGame(userId: number, data: FinishGameBody) {
    const startTime = Date.now();
    logger.info(`Bắt đầu finishGame cho user ${userId}`);
    
    try {
        // --- LOGIC NGHIỆP VỤ CHÍNH ---
        const result = await this.repository.finalizeGameResult(...);
        await this.repository.deleteSession(data.sessionId);
        
        // --- GHI ACTIVITY LOG THỦ CÔNG ---
        await activityLogRepository.createLog({
            userId,
            actionType: "USER_FINISH_GAME_SUCCESS",
            description: `Người dùng ${userId} kết thúc game...`
        });
        
        logger.info(`finishGame thành công trong ${Date.now() - startTime}ms`);
        return result;
    } catch (error) {
        logger.error(`finishGame thất bại: ${error.message}`);
        await activityLogRepository.createLog({
            userId,
            actionType: "USER_FINISH_GAME_FAILED",
            description: `Thất bại: ${error.message}`
        });
        throw error;
    }
}
```

### 1.2. Giải pháp với AOP
AOP giúp **tách biệt hoàn toàn** các tác vụ phụ trợ ra khỏi hàm nghiệp vụ. Service chỉ tập trung 100% vào logic chính:

```typescript
// ✅ SỬ DỤNG AOP DECORATORS: Code ngắn gọn, sạch sẽ, chuẩn Single Responsibility
@logExecution()
@recordActivity("USER_FINISH_GAME", (result, userId) => `Người dùng ${userId} hoàn thành game với ${result.result.totalScore} điểm`)
async finishGame(userId: number, data: FinishGameBody) {
    const result = await this.repository.finalizeGameResult(...);
    await this.repository.deleteSession(data.sessionId);
    return { message: "Hoàn tất ván chơi!", result };
}
```

---

## 🛠️ 2. Các AOP Decorators Hiện Có Trong Dự Án

Thư mục lưu trữ: [`src/shared/decorators/`](file:///d:/English-App/backend-api/src/shared/decorators/)

### 2.1. `@logExecution()` — Đo thời gian & Ghi log hàm tự động
- **File định nghĩa:** [`src/shared/decorators/log.decorator.ts`](file:///d:/English-App/backend-api/src/shared/decorators/log.decorator.ts)
- **Mục đích:** 
  - Ghi log khi phương thức được gọi (`[CALL]`), danh sách đối số đầu vào (tự động ẩn mật khẩu qua hàm `sanitizeArgs`).
  - Đo thời gian chạy tính bằng mili-giây (`duration ms`).
  - Ghi log thành công (`[SUCCESS]`) hoặc thất bại (`[FAILED]`).

#### Cách sử dụng:
```typescript
import { logExecution } from "../../shared/decorators/log.decorator.js";

export class UserService {
    @logExecution()
    async getUserProfile(userId: number) {
        return await this.userRepo.findById(userId);
    }
}
```

---

### 2.2. `@recordActivity(actionType, getDescription)` — Tự động lưu Activity Log vào Database
- **File định nghĩa:** [`src/shared/decorators/activity.decorator.ts`](file:///d:/English-App/backend-api/src/shared/decorators/activity.decorator.ts)
- **Mục đích:** Tự động ghi bản ghi vào bảng `activity_log` trong CSDL khi người dùng thực hiện một hành vi quan trọng (đăng nhập, chơi game, học từ vựng...).

#### Cấu trúc tham số:
```typescript
@recordActivity(
    actionType: string,
    getDescription?: (result: any, ...args: any[]) => string
)
```

| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `actionType` | `string` | **Có** | Tên hành động gốc (ví dụ: `"USER_LOGIN"`, `"USER_START_GAME"`, `"USER_FINISH_GAME"`). Decorator sẽ tự động gắn đuôi `_SUCCESS` hoặc `_FAILED`. |
| `getDescription` | `Function` | Không | Hàm callback nhận kết quả trả về (`result`) và danh sách tham số (`args`) để tạo chuỗi mô tả hoạt động. Nếu bỏ trống, mặc định là `"Thực hiện <methodName> thành công"`. |

---

## 🔍 3. Chi Tiết Các Biến Trong Callback `getDescription`

Callback `getDescription` có dạng:
```typescript
(result: any, ...args: any[]) => string
```

### 3.1. Biến `result` (Kết quả trả về của hàm gốc)
Là dữ liệu mà method gốc `return` sau khi chạy xong.

* **Trường hợp `AuthService.login`**:
  - `login` trả về: `{ user: { id: 1, username: "john" }, accessToken: "...", refreshToken: "..." }`
  - Truy cập: `result.user.username`
  ```typescript
  @recordActivity("USER_LOGIN", (result) => `Người dùng ${result.user.username} đăng nhập thành công`)
  ```

* **Trường hợp `BubbleGameService.finishGame`**:
  - `finishGame` trả về: `{ message: "...", result: { totalScore: 100, durationSeconds: 30 } }`
  - Truy cập: `result.result.totalScore`
  ```typescript
  @recordActivity("USER_FINISH_GAME", (result, userId) => `Người dùng ID ${userId} kết thúc game, đạt ${result.result.totalScore} điểm`)
  ```

### 3.2. Biến `...args` (Tham số truyền vào hàm gốc)
Là danh sách các đối số mà controller/caller truyền vào method.

* Giả sử method gốc có chữ ký:
  ```typescript
  async finishGame(userId: number, data: FinishGameBody)
  ```
* Thì trong callback:
  - Tham số thứ 2 (`args[0]`): chính là `userId` (`number`).
  - Tham số thứ 3 (`args[1]`): chính là `data` (`FinishGameBody`).

```typescript
@recordActivity("USER_FINISH_GAME", (result, userId, data) => 
    `Người dùng ${userId} hoàn thành phiên game ${data.sessionId} với ${result.result.totalScore} điểm`
)
async finishGame(userId: number, data: FinishGameBody) { ... }
```

---

## ⚙️ 4. Cơ Chế Hoạt Động Ngầm Của `@recordActivity`

```mermaid
flowchart TD
    A["Caller gọi Method (có @recordActivity)"] --> B["Bắt đầu Method Interception"]
    B --> C["Thực thi hàm nghiệp vụ gốc"]
    
    C -->|Thành công| D["Trích xuất userId tự động"]
    D --> E["Tạo description = getDescription(result, ...args)"]
    E --> F["activityLogRepository.createLog (actionType_SUCCESS)<br/><i>Chạy ngầm (Background Task)</i>"]
    F --> G["Return result cho Caller"]
    
    C -->|Bị lỗi (Exception)| H["Trích xuất userId từ error/args"]
    H --> I["Tạo failedDescription = 'Thất bại: ' + error.message"]
    I --> J["activityLogRepository.createLog (actionType_FAILED)<br/><i>Chạy ngầm (Background Task)</i>"]
    J --> K["Re-throw error cho ErrorHandler Middleware xử lý"]
```

### 4.1. Tự động nhận diện `userId`
Decorator tự động tìm `userId` theo thứ tự ưu tiên:
1. `result?.user?.id` (Object user trong kết quả trả về)
2. `result?.id`
3. `result?.userId`
4. `args[0]` (Nếu tham số đầu tiên là số `userId: number`)
5. `args[0]?.userId` (Nếu tham số đầu tiên là object có chứa `userId`)

### 4.2. Không làm nghẽn luồng xử lý (Non-blocking I/O)
Thao tác ghi log vào CSDL **không sử dụng `await`**, mà chạy theo cơ chế Background Promise (`.catch(...)`). Nhờ vậy, thời gian phản hồi (Response Time) trả về cho Client không bị ảnh hưởng bởi việc ghi database log.

---

## ⚠️ 5. Những Lỗi Thường Gặp & Cách Phòng Tránh

### ❌ Lỗi 1: Truy cập thuộc tính không tồn tại trong `result`
```typescript
// ❌ SAI: Hàm finishGame không return object user -> Gây lỗi Cannot read properties of undefined (reading 'username')
@recordActivity("USER_START_GAME", (result) => `Người dùng ${result.user.username} đã kết thúc game`)
async finishGame(userId: number, data: FinishGameBody) {
    return { message: "OK", result: { score: 100 } };
}

// ✅ ĐÚNG: Lấy userId từ tham số args
@recordActivity("USER_FINISH_GAME", (result, userId) => `Người dùng ID ${userId} đã kết thúc game với ${result.result.score} điểm`)
async finishGame(userId: number, data: FinishGameBody) { ... }
```

### ❌ Lỗi 2: Copy paste sai `actionType`
Đặt cùng một `actionType` cho nhiều hành động khác nhau khiến log bị sai lệch ý nghĩa (ví dụ `startGame`, `matchPair`, `finishGame` đều để là `"USER_START_GAME"`).
- `startGame` ➡️ `"USER_START_GAME"`
- `matchPair` ➡️ `"USER_MATCH_PAIR"`
- `finishGame` ➡️ `"USER_FINISH_GAME"`

---

## 🚀 6. Hướng Dẫn Tự Viết Custom AOP Decorator Mới

Khi muốn tạo thêm decorator mới (ví dụ: `@cacheable()`, `@rateLimitMethod()`, `@auditMetrics()`), bạn có thể dùng template chuẩn sau:

```typescript
// src/shared/decorators/custom.decorator.ts
export function customDecorator(param1?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // 1. [BEFORE ADVICE]: Xử lý trước khi hàm chạy
            const start = Date.now();

            try {
                // 2. [JOIN POINT]: Thực thi hàm nghiệp vụ gốc
                const result = await originalMethod.apply(this, args);

                // 3. [AFTER RETURNING]: Xử lý sau khi hàm thành công
                // Ví dụ: Lưu cache, tính metric...

                return result;
            } catch (error: any) {
                // 4. [AFTER THROWING]: Xử lý khi có ngoại lệ
                // Ví dụ: Ghi log lỗi chuyên biệt, rollback tài nguyên...
                throw error;
            }
        };

        return descriptor;
    };
}
```

---

## 📋 7. Tóm Tắt Quy Chuẩn

1. **Service Class**: Luôn gắn `@logExecution()` trên các method public quan trọng để theo dõi hiệu năng và debug.
2. **Activity Logging**: Sử dụng `@recordActivity(...)` cho các thao tác ảnh hưởng đến dữ liệu hoặc trải nghiệm người dùng, tuyệt đối không gọi `activityLogRepository.createLog(...)` thủ công trong tầng Service.
3. **Kiểm tra kỹ tham số callback**: Đảm bảo các trường truy cập trong `(result, ...args)` khớp với dữ liệu thực tế được trả về hoặc truyền vào của method đó.
