# 🔗 Tài Liệu Kỹ Thuật Module Word Matching (Trò Chơi Nối Từ Vựng)

Tài liệu này mô tả chi tiết đặc tả Request / Response, các mã lỗi API có thể trả về, phân quyền (Role) sử dụng, và các giới hạn kỹ thuật của module `word-matching` (Trò chơi nối 2 cột: Cột A Từ vựng tiếng Anh và Cột B Ý nghĩa tiếng Việt).

---

## 📌 1. Thông Tin Chung & Quyền Truy Cập (Role & Permissions)

* **Base Path:** `/game/word-matching` (Được mount trong `src/app.ts`).
* **Cơ chế xác thực:** Tất cả các endpoint trong module đều bắt buộc đi qua Middleware `Authenticate` (Header `Authorization: Bearer <access_token>`).
* **Roles được phép sử dụng:**
  * Toàn bộ người dùng đã đăng nhập hợp lệ trong hệ thống đều có thể tham gia (bao gồm role **`user`** và **`admin`**).
  * Module **không** áp dụng middleware `authorize(...)` hạn chế vai trò vì đây là tính năng học tập dành cho học viên.
  * Người dùng chưa đăng nhập hoặc thiếu token sẽ bị từ chối truy cập với mã HTTP `401 Unauthorized`.

---

## 🚀 2. Chi Tiết Request & Response Từng Endpoint

### 2.1. `GET /game/word-matching/start` — Khởi Tạo Bàn Chơi Nối Từ

Khởi tạo một ván chơi nối từ mới. Backend truy vấn danh sách từ vựng theo bài học hoặc toàn kho từ, chia thành hai danh sách độc lập: **Cột A** (Từ vựng tiếng Anh, phiên âm, audio) và **Cột B** (Nghĩa tiếng Việt, loại từ, hình ảnh). Sau đó, cả 2 cột đều được xáo trộn ngẫu nhiên độc lập bằng thuật toán Fisher-Yates để đảo lộn thứ tự vị trí trước khi gửi về cho Client.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters:**
  | Tên tham số | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `lessonId` | `integer` | Không | Không | ID bài học cần lấy từ vựng (số nguyên $> 0$). |
  | `limit` | `integer` | Không | `10` | Số lượng từ vựng trong ván chơi. Tối thiểu `4`, tối đa `20`. Mặc định là `10` từ. |

* **Ví dụ Request:**
  ```http
  GET /game/word-matching/start?lessonId=2&limit=5 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer eyJhbGciOi...
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Khởi tạo ván chơi nối từ vựng thành công",
    "data": {
      "totalWords": 5,
      "columnA": [
        {
          "id": 18,
          "word": "versatile",
          "phonetic": "/ˈvɝː.sə.t̬əl/",
          "audioUrl": "https://example.com/audios/versatile.mp3"
        },
        {
          "id": 12,
          "word": "collaborate",
          "phonetic": "/kəˈlæb.ə.reɪt/",
          "audioUrl": "https://example.com/audios/collaborate.mp3"
        }
      ],
      "columnB": [
        {
          "id": 12,
          "meaning": "hợp tác, cộng tác",
          "partOfSpeech": "verb",
          "imageUrl": "https://example.com/images/collaborate.png"
        },
        {
          "id": 18,
          "meaning": "đa năng, linh hoạt",
          "partOfSpeech": "adjective",
          "imageUrl": "https://example.com/images/versatile.png"
        }
      ]
    }
  }
  ```

---

### 2.2. `POST /game/word-matching/submit` — Nộp Bài, Chấm Điểm & Trả Về Kết Quả Chi Tiết

Được gọi khi người chơi hoàn thành việc nối các cặp từ và bấm nộp bài. Khác với hai game trước, **Backend tự thực hiện chấm điểm ở phía Server**: đối chiếu từng cặp `wordId` và `selectedMeaningId`, tính toán số câu đúng/sai, tự tính điểm XP ($10 \text{ điểm}/\text{câu đúng}$), cộng XP vào tài khoản MySQL và trả về chi tiết lời giải.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  | Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- |
  | `lessonId` | `integer` | Không | ID bài học tương ứng (số nguyên $> 0$). |
  | `duration` | `integer` | **Có** | Thời gian làm bài tính bằng giây ($\ge 0$). |
  | `answers` | `array` | **Có** | Danh sách các cặp nối của người chơi (mảng tối thiểu 1 phần tử). |
  | `answers[].wordId` | `integer` | **Có** | ID của từ tiếng Anh ở Cột A. |
  | `answers[].selectedMeaningId` | `integer` | **Có** | ID của nghĩa tiếng Việt được nối ở Cột B. |

* **Ví dụ Request Body:**
  ```json
  {
    "lessonId": 2,
    "duration": 45,
    "answers": [
      {
        "wordId": 18,
        "selectedMeaningId": 18
      },
      {
        "wordId": 12,
        "selectedMeaningId": 25
      }
    ]
  }
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Xác nhận kết quả nối từ thành công",
    "data": {
      "totalQuestions": 2,
      "correctCount": 1,
      "wrongCount": 1,
      "score": 10,
      "maxScore": 20,
      "earnedXp": 10,
      "currentXp": 490,
      "duration": 45,
      "details": [
        {
          "wordId": 18,
          "word": "versatile",
          "correctMeaning": "đa năng, linh hoạt",
          "partOfSpeech": "adjective",
          "userSelectedMeaningId": 18,
          "userSelectedMeaning": "đa năng, linh hoạt",
          "isCorrect": true
        },
        {
          "wordId": 12,
          "word": "collaborate",
          "correctMeaning": "hợp tác, cộng tác",
          "partOfSpeech": "verb",
          "userSelectedMeaningId": 25,
          "userSelectedMeaning": "cản trở, gây trở ngại",
          "isCorrect": false
        }
      ]
    }
  }
  ```

---

### 2.3. `POST /game/word-matching/progress` — Lưu Tiến Trình Nối Tạm Thời

Được gọi trong quá trình chơi nếu học viên muốn lưu lại trạng thái các đường nối hiện tại để tránh mất kết nối giữa chừng.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  | Trường | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `lessonId` | `integer` | Không | - | ID bài học tương ứng (số nguyên $> 0$). |
  | `currentMatchedPairs` | `integer` | Không | `0` | Số cặp từ người dùng đã thực hiện nối ($\ge 0$). |
  | `totalPairs` | `integer` | Không | `10` | Tổng số cặp từ cần nối ($\ge 1$). |
  | `connectedPairs` | `array` | Không | `[]` | Mảng các cặp `{ wordId, selectedMeaningId }` đã nối. |

* **Ví dụ Request Body:**
  ```json
  {
    "lessonId": 2,
    "currentMatchedPairs": 3,
    "totalPairs": 10,
    "connectedPairs": [
      { "wordId": 18, "selectedMeaningId": 18 },
      { "wordId": 12, "selectedMeaningId": 12 }
    ]
  }
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Lưu tiến trình tạm thời thành công",
    "data": {
      "message": "Lưu tiến trình tạm thời thành công",
      "currentMatchedPairs": 3,
      "totalPairs": 10
    }
  }
  ```

---

## ⚠️ 3. Danh Sách Các Mã Lỗi API Có Thể Trả Về (Error Handling)

Tất cả các lỗi được định dạng đồng bộ qua `errorHandler` (`src/shared/http/error-handler.ts`):

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

| Mã lỗi (`code`) | Mô tả nguyên nhân | HTTP Status |
| :--- | :--- | :--- |
| `unauthorized` | Thiếu Header `Authorization` hoặc không có tiền tố `Bearer `. | `401` |
| `token_missing` | Token rỗng sau tiền tố `Bearer `. | `401` |
| `token_revoked` | Token đã bị thu hồi do đăng xuất (nằm trong bảng `revoked_token`). | `401` |
| `token_expired_or_invalid` | Token hết hạn sử dụng hoặc chữ ký bảo mật không hợp lệ. | `401` |

*Ví dụ Response 401:*
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Client chưa đăng nhập hoặc thiếu header Authorization"
  },
  "path": "/game/word-matching/start"
}
```

---

### 3.2. Nhóm Lỗi Dữ Liệu Đầu Vào (HTTP 422 Unprocessable Entity)
Do Middleware `validate(...)` và Zod Schema chặn lại khi tham số đầu vào không hợp lệ:

* **Mã lỗi:** `validation_error`
* Kèm theo chi tiết lỗi ở trường `details.fieldErrors`.

*Các trường hợp phổ biến:*
* `GET /start`: `limit < 4` hoặc `limit > 20`, hoặc `lessonId <= 0`.
* `POST /submit`: `duration < 0`, mảng `answers` bị rỗng (`min(1)`), hoặc thiếu trường `wordId`/`selectedMeaningId`.
* `POST /progress`: `currentMatchedPairs < 0`, `totalPairs < 1`, hoặc sai cấu trúc `connectedPairs`.

*Ví dụ Response 422:*
```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "answers": ["Danh sách câu trả lời không được để trống"]
      }
    }
  },
  "path": "/game/word-matching/submit"
}
```

---

### 3.3. Nhóm Lỗi Nghiệp Vụ (HTTP 400 Bad Request)
Do logic nghiệp vụ trong Service ném ra (`ApiError`):

| Mã lỗi (`code`) | Endpoint | Nguyên nhân |
| :--- | :--- | :--- |
| `not_enough_words` | `GET /start` | Bài học (`lessonId`) hoặc hệ thống không đủ số lượng từ vựng tối thiểu theo tham số `limit` (mặc định cần tối thiểu 10 từ). |

*Ví dụ Response 400:*
```json
{
  "error": {
    "code": "not_enough_words",
    "message": "Không đủ từ vựng để tạo bàn chơi nối từ (cần tối thiểu 10 từ)."
  },
  "path": "/game/word-matching/start"
}
```

---

### 3.4. Nhóm Lỗi Hệ Thống & Cơ Sở Dữ Liệu (HTTP 500 Internal Server Error)

| Mã lỗi (`code`) | Nguyên nhân |
| :--- | :--- |
| Mã lỗi từ Prisma | Lỗi kết nối hoặc truy vấn đến cơ sở dữ liệu MySQL (`PrismaClientInitializationError`). |
| `internal_error` | Lỗi ngoại lệ runtime không lường trước phát sinh trên máy chủ. |

*Ví dụ Response 500:*
```json
{
  "error": {
    "code": "internal_error",
    "message": "Lỗi không xác định từ Server"
  },
  "path": "/game/word-matching/submit"
}
```

---

## ⚠️ 4. Các Giới Hạn Kỹ Thuật Hiện Tại (Limitations & Technical Debt)

Khi phát triển hoặc tích hợp module `word-matching`, cần lưu ý các vấn đề kỹ thuật sau:

1. **Lộ ID ghép cặp ở Client (Client-Side Inspection Risk):**
   * Mặc dù thứ tự hiển thị của `columnA` và `columnB` đã được xáo trộn độc lập, nhưng cả hai cột đều để lộ trường `id` của từ vựng gốc (`w.id`).
   * **Hạn chế:** Người dùng có hiểu biết kỹ thuật chỉ cần xem Response JSON trong tab Network/DevTools là có thể biết ngay từ ở Cột A có `id = X` sẽ ghép với mục ở Cột B có cùng `id = X`. *(Giải pháp khuyến nghị: Backend có thể mã hóa/hash id của Cột B hoặc dùng UUID ngẫu nhiên cho từng lượt chơi để che giấu ID gốc).*

2. **Tiến trình tạm thời lưu trên RAM (`progressStore` Map):**
   * Tương tự các game khác, tiến trình dở dang được lưu bằng biến toàn cục `Map<number, WordMatchingProgress>` trong RAM.
   * **Hạn chế:** Mất trạng thái khi server khởi động lại; không thể chia sẻ dữ liệu giữa nhiều worker/pod (nếu chạy multi-instance); không có cơ chế TTL tự động xóa tiến trình cũ nếu học viên bỏ cuộc.

3. **Cơ chế tính điểm cố định (Fixed Scoring):**
   * Điểm số được ấn định cứng $10 \text{ điểm}$ cho mỗi câu đúng. Chưa có hệ số nhân theo thời gian hoàn thành (`duration`) hoặc theo độ khó của bài học.

4. **Chưa validate chặt chẽ mảng câu trả lời (`answers`):**
   * Endpoint `POST /submit` chỉ kiểm tra `answers.length >= 1`.
   * **Lỗ hổng logic tiềm ẩn:** Chưa kiểm tra xem các `wordId` gửi lên có bị trùng lặp không, hoặc số lượng câu nộp lên có vượt quá số từ của ván chơi ban đầu hay không.

5. **Chưa có bảng lưu lịch sử kết quả chi tiết:**
   * Hiện tại, hệ thống chỉ cộng điểm vào `User.xpPoints` và ghi nhận nhật ký tổng quát qua `@recordActivity` vào bảng `activity_log`.
   * Chưa có bảng dữ liệu chuyên biệt (ví dụ `word_matching_session`) để lưu chi tiết các từ học viên hay nối sai, nhằm phục vụ tính năng gợi ý ôn tập từ vựng yếu.
