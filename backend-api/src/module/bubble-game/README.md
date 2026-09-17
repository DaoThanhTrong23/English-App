# 🫧 Tài Liệu Kỹ Thuật Module Bubble Game (Trò Chơi Nối Bong Bóng)

Tài liệu này mô tả chi tiết đặc tả Request / Response, các mã lỗi API có thể trả về, phân quyền (Role) sử dụng, và các giới hạn kỹ thuật hiện tại của module `bubble-game`.

---

## 📌 1. Thông Tin Chung & Quyền Truy Cập (Role & Permissions)

* **Base Path:** `/game/bubble-game` (Được mount trong `src/app.ts`).
* **Cơ chế xác thực:** Tất cả các endpoint trong module đều bắt buộc đi qua Middleware `Authenticate` (`Bearer JWT Token`).
* **Roles được phép sử dụng:**
  * Toàn bộ tài khoản người dùng đã đăng nhập hợp lệ trong hệ thống đều có thể sử dụng (bao gồm cả role **`user`** và **`admin`**).
  * Route **không** áp dụng middleware `authorize(...)` hạn chế quyền, vì đây là tính năng học tập/trò chơi dành cho học viên đại chúng.
  * Khách vãng lai (chưa đăng nhập / thiếu token) sẽ bị từ chối truy cập với mã lỗi HTTP `401 Unauthorized`.

---

## 🚀 2. Chi Tiết Request & Response Từng Endpoint

### 2.1. `GET /game/bubble-game/start` — Khởi Tạo Ván Chơi & Lấy Danh Sách Bong Bóng

Khởi tạo một ván chơi mới. Backend truy vấn từ vựng theo bài học hoặc toàn kho từ, kiểm tra số lượng và xáo trộn ngẫu nhiên danh sách bong bóng từ vựng và bong bóng nghĩa trước khi trả về cho Client.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters:**
  | Tên tham số | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `lessonId` | `integer` | Không | Không | ID bài học cần lấy từ vựng. Phải là số nguyên $> 0$. |
  | `limit` | `integer` | Không | `8` | Số cặp từ vựng trong ván chơi. Tối thiểu là `4`, tối đa là `20`. |

* **Ví dụ Request:**
  ```http
  GET /game/bubble-game/start?lessonId=3&limit=6 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer eyJhbGciOi...
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "data": {
      "totalPairs": 6,
      "wordBubbles": [
        {
          "id": 14,
          "word": "abandon",
          "partOfSpeech": "verb",
          "phonetic": "/əˈbæn.dən/"
        },
        {
          "id": 22,
          "word": "brilliant",
          "partOfSpeech": "adjective",
          "phonetic": "/ˈbrɪl.jənt/"
        }
      ],
      "meaningBubbles": [
        {
          "id": 22,
          "meaning": "xuất sắc, thông minh tuyệt vời",
          "imageUrl": "https://example.com/images/brilliant.png",
          "audioUrl": "https://example.com/audios/brilliant.mp3"
        },
        {
          "id": 14,
          "meaning": "từ bỏ, bỏ rơi",
          "imageUrl": "https://example.com/images/abandon.png",
          "audioUrl": "https://example.com/audios/abandon.mp3"
        }
      ]
    }
  }
  ```

---

### 2.2. `POST /game/bubble-game/match` — Cập Nhật Tiến Trình Tạm Thời

Được gọi trong quá trình chơi khi Client ghép thành công một cặp từ vựng, nhằm cập nhật tiến trình chơi dở dang vào bộ nhớ đệm (RAM) của server.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  | Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- |
  | `currentScore` | `integer` | **Có** | Điểm số hiện tại của người chơi ($\ge 0$). |
  | `matchedPairs` | `integer` | **Có** | Số cặp bong bóng đã ghép thành công ($\ge 0$). |
  | `totalPairs` | `integer` | **Có** | Tổng số cặp bong bóng của ván chơi ($\ge 1$). |
  | `lessonId` | `integer` | Không | ID bài học tương ứng (số nguyên $> 0$). |

* **Ví dụ Request Body:**
  ```json
  {
    "currentScore": 30,
    "matchedPairs": 3,
    "totalPairs": 6,
    "lessonId": 3
  }
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "data": {
      "message": "Lưu tiến trình tạm thời thành công",
      "currentScore": 30,
      "matchedPairs": 3,
      "totalPairs": 6
    }
  }
  ```

---

### 2.3. `POST /game/bubble-game/finish` — Chốt Kết Quả & Cộng Điểm Ván Chơi

Được gọi khi người chơi hoàn thành toàn bộ bàn chơi hoặc hết giờ. Server sẽ chốt điểm, cộng điểm kinh nghiệm (XP) vào tài khoản người chơi trong cơ sở dữ liệu và giải phóng tiến trình tạm thời.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  | Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- |
  | `totalScore` | `integer` | **Có** | Tổng điểm số người chơi đạt được ($\ge 0$). |
  | `duration` | `integer` | **Có** | Thời gian chơi tính bằng giây ($\ge 0$). |
  | `correctPairs` | `integer` | **Có** | Tổng số cặp ghép đúng ($\ge 0$). |
  | `totalPairs` | `integer` | **Có** | Tổng số cặp từ của ván ($\ge 1$). |
  | `lessonId` | `integer` | Không | ID bài học tương ứng (số nguyên $> 0$). |

* **Ví dụ Request Body:**
  ```json
  {
    "totalScore": 60,
    "duration": 42,
    "correctPairs": 6,
    "totalPairs": 6,
    "lessonId": 3
  }
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "data": {
      "message": "Hoàn tất ván chơi thành công!",
      "result": {
        "totalScore": 60,
        "durationSeconds": 42,
        "correctPairs": 6,
        "totalPairs": 6,
        "currentXp": 380
      }
    }
  }
  ```

---

## ⚠️ 3. Danh Sách Các Mã Lỗi API Có Thể Trả Về (Error Handling)

Tất cả các lỗi đều tuân thủ cấu trúc chuẩn từ `errorHandler` (`src/shared/http/error-handler.ts`):

```json
{
  "error": {
    "code": "<mã_lỗi>",
    "message": "<thông_điệp_lỗi>"
  },
  "path": "<url_request>"
}
```

### 3.1. Nhóm Lỗi Xác Thực (HTTP 401 Unauthorized)
Xảy ra khi có sự cố liên quan đến JWT Token:

| Mã lỗi (`code`) | Mô tả nguyên nhân | HTTP Status |
| :--- | :--- | :--- |
| `unauthorized` | Thiếu Header `Authorization` hoặc không có tiền tố `Bearer `. | `401` |
| `token_missing` | Chuỗi Token sau `Bearer ` bị rỗng. | `401` |
| `token_revoked` | Token này đã bị đăng xuất / thu hồi (nằm trong bảng `revoked_token`). | `401` |
| `token_expired_or_invalid` | Token hết hạn sử dụng (hết TTL) hoặc chữ ký không hợp lệ/bị sửa đổi. | `401` |

*Ví dụ Response 401:*
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Client chưa đăng nhập hoặc thiếu header Authorization"
  },
  "path": "/game/bubble-game/start"
}
```

---

### 3.2. Nhóm Lỗi Dữ Liệu Không Hợp Lệ (HTTP 422 Unprocessable Entity)
Do Middleware `validate(...)` và Zod Schema chặn lại khi tham số đầu vào không đúng định dạng hoặc vi phạm ràng buộc:

* Mã lỗi: `validation_error`
* Kèm theo trường `details` mô tả chi tiết các trường bị lỗi (`fieldErrors`, `formErrors`).

*Các trường hợp phổ biến:*
* `GET /start`: `limit < 4` hoặc `limit > 20`, hoặc `lessonId <= 0`.
* `POST /match`: `currentScore < 0`, `matchedPairs < 0`, `totalPairs < 1`, hoặc thiếu trường bắt buộc.
* `POST /finish`: `totalScore < 0`, `duration < 0`, `correctPairs < 0`, hoặc thiếu trường bắt buộc.

*Ví dụ Response 422:*
```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "limit": ["Cần tối thiểu 4 cặp từ để chơi"]
      }
    }
  },
  "path": "/game/bubble-game/start"
}
```

---

### 3.3. Nhóm Lỗi Nghiệp Vụ (HTTP 400 Bad Request)
Do tầng Service ném ngoại lệ `ApiError`:

| Mã lỗi (`code`) | Endpoint | Nguyên nhân |
| :--- | :--- | :--- |
| `not_enough_words` | `GET /start` | Bài học (`lessonId`) hoặc hệ thống không có đủ tối thiểu **4 từ vựng** để khởi tạo bàn chơi. |

*Ví dụ Response 400:*
```json
{
  "error": {
    "code": "not_enough_words",
    "message": "Không đủ từ vựng để tạo bàn chơi (cần tối thiểu 4 từ)."
  },
  "path": "/game/bubble-game/start"
}
```

---

### 3.4. Nhóm Lỗi Máy Chủ & Cơ Sở Dữ Liệu (HTTP 500 Internal Server Error)
Xảy ra khi có sự cố hệ thống chưa lường trước hoặc lỗi kết nối DB:

| Mã lỗi (`code`) | Nguyên nhân |
| :--- | :--- |
| Mã lỗi từ Prisma | Lỗi khởi tạo hoặc mất kết nối đến cơ sở dữ liệu MySQL (`PrismaClientInitializationError`). |
| `internal_error` | Lỗi ngoại lệ runtime không xác định phát sinh trên máy chủ. |

*Ví dụ Response 500:*
```json
{
  "error": {
    "code": "internal_error",
    "message": "Lỗi không xác định từ Server"
  },
  "path": "/game/bubble-game/finish"
}
```

---

## ⚠️ 4. Các Giới Hạn & Điểm Cần Lưu Ý (Limitations & Technical Debt)

Khi phát triển hoặc tích hợp module `bubble-game`, cần lưu ý các giới hạn sau:

1. **Tiến trình tạm thời lưu trên RAM (`In-Memory State`):**
   * Trong [bubble-game.repository.ts](file:///D:/Hoc_Tap_Nam_4/KLTN/English-App/backend-api/src/module/bubble-game/bubble-game.repository.ts), tiến trình chơi tạm được lưu bằng `Map<number, TemporaryProgress>` trên bộ nhớ RAM của tiến trình Node.js.
   * **Hạn chế:**
     * Khi server restart hoặc deploy phiên bản mới, toàn bộ tiến trình tạm thời đang chơi của người dùng sẽ bị mất.
     * **Không hỗ trợ kiến trúc Multi-instance / Scale ngang:** Nếu ứng dụng chạy nhiều pod (Docker/Kubernetes) hoặc qua Cluster/Load Balancer, request `/match` và `/finish` có thể rơi vào instance khác và không tìm thấy dữ liệu. *(Khuyến nghị trong tương lai: Thay `Map` bằng Redis).*
     * Không có cơ chế Time-to-Live (TTL) dọn rác tự động nếu người dùng bỏ dở ván chơi mà không gọi `/finish`.

2. **Xác thực kết quả ghép cặp ở Client (Client-side Validation & Rủi ro Anti-Cheat):**
   * Danh sách trả về từ `GET /start` chứa sẵn `id` của từ ở cả 2 mảng `wordBubbles` và `meaningBubbles`. Frontend tự so khớp xem `wordBubble.id === meaningBubble.id`.
   * Ở endpoint `POST /finish`, Frontend tự tính toán và gửi toàn bộ `totalScore`, `duration`, `correctPairs`. Backend chưa kiểm tra lại tính hợp lệ của điểm số (ví dụ: điểm có vượt quá `totalPairs * điểm_mỗi_câu` hay không, hoặc thời gian chơi có vô lý không) mà trực tiếp cộng `totalScore` vào `user.xpPoints`.
   * **Hạn chế:** Người dùng am hiểu kỹ thuật có thể dùng Postman/Script gửi điểm ảo để cày cấp XP.

3. **Giới hạn số lượng từ vựng:**
   * Mỗi ván chơi bị giới hạn cứng từ **4 đến 20 cặp từ** (`min: 4`, `max: 20`).
   * Nếu bài học có ít hơn 4 từ vựng, ván chơi sẽ không thể khởi tạo.

4. **Chưa có bảng lưu lịch sử ván đấu chuyên biệt:**
   * Kết quả ván chơi hiện chỉ tăng điểm trực tiếp vào thuộc tính `xpPoints` của bảng `User` và lưu vết qua decorator `@recordActivity` vào bảng `activity_log`.
   * Chưa có bảng `GameSession` hoặc `BubbleGameHistory` để lưu chi tiết từng lượt chơi (tỷ lệ đúng, các từ làm sai, thời gian từng câu) để phục vụ phân tích năng lực học viên.
