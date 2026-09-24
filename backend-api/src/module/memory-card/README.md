# 🃏 Tài Liệu Kỹ Thuật Module Memory Card (Trò Chơi Lật Thẻ Trí Nhớ)

Tài liệu này mô tả chi tiết đặc tả Request / Response, các mã lỗi API có thể trả về, phân quyền (Role) sử dụng, và các giới hạn kỹ thuật của module `memory-card` (Memory Game).

---

## 📌 1. Thông Tin Chung & Quyền Truy Cập (Role & Permissions)

* **Base Path:** `/game/memory-card` (Được khai báo và mount trong `src/app.ts`).
* **Cơ chế xác thực:** Tất cả các endpoint trong module đều bắt buộc đi qua Middleware `Authenticate` (yêu cầu Access Token trong Header `Authorization: Bearer <access_token>`).
* **Roles được phép sử dụng:**
  * Toàn bộ tài khoản đã đăng nhập hợp lệ trong hệ thống đều có thể chơi game (bao gồm cả role **`user`** và **`admin`**).
  * Module **không** sử dụng middleware `authorize(...)` hạn chế vai trò, vì đây là tính năng học tập dành cho học viên.
  * Khách vãng lai (chưa đăng nhập hoặc thiếu token) sẽ bị từ chối truy cập với mã lỗi HTTP `401 Unauthorized`.

---

## 🚀 2. Chi Tiết Request & Response Từng Endpoint

### 2.1. `GET /game/memory-card/start` — Khởi Tạo Ván Chơi & Lấy Thẻ Bài Đã Trộn

Khởi tạo một ván chơi lật thẻ trí nhớ mới. Backend lấy từ vựng theo bài học hoặc toàn hệ thống, tạo thành các cặp thẻ (1 thẻ Tiếng Anh + 1 thẻ Ý nghĩa Tiếng Việt) và xáo trộn ngẫu nhiên toàn bộ thẻ trước khi trả về cho Client hiển thị trên lưới (ví dụ: lưới 3x4 hoặc 4x3 với 12 thẻ).

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters:**
  | Tên tham số | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `lessonId` | `integer` | Không | Không | ID bài học cần lấy từ vựng (số nguyên $> 0$). |
  | `limit` | `integer` | Không | `6` | Số cặp từ vựng. Tối thiểu `2`, tối đa `12`. Mặc định là `6` (tương ứng $6 \times 2 = 12$ thẻ bài). |

* **Ví dụ Request:**
  ```http
  GET /game/memory-card/start?lessonId=5&limit=6 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer eyJhbGciOi...
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Khởi tạo ván Memory Card thành công",
    "data": {
      "totalPairs": 6,
      "totalCards": 12,
      "cards": [
        {
          "id": "card_word_10",
          "pairId": 10,
          "type": "word",
          "content": "persistent",
          "phonetic": "/pɚˈsɪs.tənt/",
          "partOfSpeech": "adjective"
        },
        {
          "id": "card_meaning_10",
          "pairId": 10,
          "type": "meaning",
          "content": "kiên trì, bền bỉ",
          "imageUrl": "https://example.com/images/persistent.png",
          "audioUrl": "https://example.com/audios/persistent.mp3"
        },
        {
          "id": "card_meaning_15",
          "pairId": 15,
          "type": "meaning",
          "content": "thành thạo, lưu loát",
          "imageUrl": null,
          "audioUrl": null
        },
        {
          "id": "card_word_15",
          "pairId": 15,
          "type": "word",
          "content": "fluent",
          "phonetic": "/ˈfluː.ənt/",
          "partOfSpeech": "adjective"
        }
      ]
    }
  }
  ```

> 💡 **Quy ước thẻ bài:** Hai thẻ bài được coi là một cặp ghép đúng nếu có cùng giá trị `pairId`.

---

### 2.2. `POST /game/memory-card/progress` — Lưu Tiến Trình Tạm Thời

Được gọi định kỳ hoặc khi người chơi lật đúng cặp thẻ / hoàn thành một lượt lật, nhằm lưu tiến trình tạm thời vào bộ nhớ RAM của server để có thể khôi phục trạng thái ván đấu nếu gặp sự cố mạng.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  | Trường | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `currentScore` | `integer` | **Có** | - | Điểm số hiện tại của người chơi ($\ge 0$). |
  | `matchedPairs` | `integer` | **Có** | - | Số cặp thẻ đã lật mở thành công ($\ge 0$). |
  | `totalPairs` | `integer` | **Có** | `6` | Tổng số cặp thẻ của ván ($\ge 1$). |
  | `turns` | `integer` | **Có** | `0` | Tổng số lượt lật thẻ đã thực hiện ($\ge 0$). |
  | `lessonId` | `integer` | Không | - | ID bài học tương ứng (số nguyên $> 0$). |

* **Ví dụ Request Body:**
  ```json
  {
    "currentScore": 25,
    "matchedPairs": 2,
    "totalPairs": 6,
    "turns": 5,
    "lessonId": 5
  }
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Lưu tiến trình thành công",
    "data": {
      "message": "Lưu tiến trình tạm thời thành công",
      "currentScore": 25,
      "matchedPairs": 2,
      "totalPairs": 6,
      "turns": 5
    }
  }
  ```

---

### 2.3. `POST /game/memory-card/finish` — Chốt Kết Quả Ván Chơi & Cộng Điểm

Được gọi khi người chơi hoàn thành tất cả các cặp thẻ hoặc hết giờ. Server sẽ tính toán kết quả, cộng điểm kinh nghiệm (XP) vào tài khoản người dùng trong cơ sở dữ liệu và giải phóng tiến trình tạm trong RAM.

* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  | Trường | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `totalScore` | `integer` | **Có** | - | Tổng điểm đạt được sau ván chơi ($\ge 0$). |
  | `duration` | `integer` | **Có** | - | Thời gian hoàn thành ván chơi tính bằng giây ($\ge 0$). |
  | `turns` | `integer` | **Có** | - | Tổng số lượt lật thẻ đã thực hiện ($\ge 0$). |
  | `correctPairs` | `integer` | **Có** | - | Số cặp thẻ ghép đúng ($\ge 0$). |
  | `totalPairs` | `integer` | **Có** | `6` | Tổng số cặp thẻ của ván ($\ge 1$). |
  | `lessonId` | `integer` | Không | - | ID bài học tương ứng (số nguyên $> 0$). |

* **Ví dụ Request Body:**
  ```json
  {
    "totalScore": 80,
    "duration": 48,
    "turns": 14,
    "correctPairs": 6,
    "totalPairs": 6,
    "lessonId": 5
  }
  ```

* **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Kết thúc ván Memory Card thành công",
    "data": {
      "message": "Hoàn tất ván Memory Card thành công!",
      "result": {
        "totalScore": 80,
        "durationSeconds": 48,
        "turns": 14,
        "correctPairs": 6,
        "totalPairs": 6,
        "currentXp": 460
      }
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
Xảy ra khi Token không hợp lệ hoặc thiếu thông tin phiên đăng nhập:

| Mã lỗi (`code`) | Mô tả nguyên nhân | HTTP Status |
| :--- | :--- | :--- |
| `unauthorized` | Thiếu Header `Authorization` hoặc không đúng định dạng `Bearer <token>`. | `401` |
| `token_missing` | Token rỗng sau `Bearer `. | `401` |
| `token_revoked` | Token đã bị thu hồi/đăng xuất (nằm trong bảng `revoked_token`). | `401` |
| `token_expired_or_invalid` | Token đã hết hạn sử dụng hoặc chữ ký bảo mật không hợp lệ. | `401` |

*Ví dụ Response 401:*
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Client chưa đăng nhập hoặc thiếu header Authorization"
  },
  "path": "/game/memory-card/start"
}
```

---

### 3.2. Nhóm Lỗi Dữ Liệu Đầu Vào (HTTP 422 Unprocessable Entity)
Do Middleware `validate(...)` và Zod Schema chặn lại khi tham số đầu vào không hợp lệ:

* **Mã lỗi:** `validation_error`
* Kèm theo chi tiết lỗi ở trường `details.fieldErrors`.

*Các trường hợp phổ biến:*
* `GET /start`: `limit < 2` hoặc `limit > 12`, hoặc `lessonId <= 0`.
* `POST /progress`: `currentScore < 0`, `matchedPairs < 0`, `totalPairs < 1`, `turns < 0`, hoặc thiếu các trường bắt buộc.
* `POST /finish`: `totalScore < 0`, `duration < 0`, `turns < 0`, `correctPairs < 0`, `totalPairs < 1`, hoặc thiếu các trường bắt buộc.

*Ví dụ Response 422:*
```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "limit": ["Cần tối thiểu 2 cặp từ để chơi"]
      }
    }
  },
  "path": "/game/memory-card/start"
}
```

---

### 3.3. Nhóm Lỗi Nghiệp Vụ (HTTP 400 Bad Request)
Do logic nghiệp vụ trong Service ném ra (`ApiError`):

| Mã lỗi (`code`) | Endpoint | Nguyên nhân |
| :--- | :--- | :--- |
| `not_enough_words` | `GET /start` | Bài học (`lessonId`) hoặc kho từ vựng không có đủ số lượng từ tối thiểu theo yêu cầu `limit` (mặc định cần tối thiểu 6 từ). |

*Ví dụ Response 400:*
```json
{
  "error": {
    "code": "not_enough_words",
    "message": "Không đủ từ vựng để tạo bàn chơi (cần tối thiểu 6 từ)."
  },
  "path": "/game/memory-card/start"
}
```

---

### 3.4. Nhóm Lỗi Hệ Thống & Cơ Sở Dữ Liệu (HTTP 500 Internal Server Error)

| Mã lỗi (`code`) | Nguyên nhân |
| :--- | :--- |
| Mã lỗi từ Prisma | Lỗi khởi tạo hoặc mất kết nối đến cơ sở dữ liệu MySQL (`PrismaClientInitializationError`). |
| `internal_error` | Lỗi ngoại lệ runtime không lường trước trên server. |

*Ví dụ Response 500:*
```json
{
  "error": {
    "code": "internal_error",
    "message": "Lỗi không xác định từ Server"
  },
  "path": "/game/memory-card/finish"
}
```

---

## ⚠️ 4. Các Giới Hạn Kỹ Thuật Hiện Tại (Limitations & Technical Debt)

Khi phát triển, mở rộng hoặc tích hợp module `memory-card`, cần lưu ý các vấn đề kỹ thuật sau:

1. **Lưu trữ tiến trình tạm thời trên RAM (`memoryStore` Map):**
   * Trong [memory-card.repository.ts](file:///D:/Hoc_Tap_Nam_4/KLTN/English-App/backend-api/src/module/memory-card/memory-card.repository.ts), dữ liệu tiến trình tạm thời của từng người dùng được lưu bằng biến toàn cục `Map<number, MemoryGameProgress>`.
   * **Hạn chế:**
     * **Mất dữ liệu khi khởi động lại:** Mỗi khi server restart hoặc redeploy, tất cả ván chơi đang diễn ra dở dang của người dùng bị xóa hoàn toàn khỏi bộ nhớ.
     * **Không hỗ trợ kiến trúc Multi-Instance / Scale Ngang:** Khi hệ thống chạy qua Load Balancer hoặc cụm Kubernetes/PM2 Cluster, các request liên tiếp (`/progress`, `/finish`) có thể chuyển hướng đến các worker khác nhau và không tìm thấy trạng thái ván chơi trong RAM. *(Giải pháp khuyến nghị: Chuyển sang lưu trữ bằng Redis với TTL).*
     * **Rò rỉ bộ nhớ (Memory Leak tiềm ẩn):** Nếu người chơi bắt đầu ván nhưng tắt ứng dụng mà không hoàn thành (`/finish`), bản ghi trong `memoryStore` sẽ tồn tại vĩnh viễn trong RAM vì chưa có cơ chế timeout/dọn rác tự động.

2. **Lộ đáp án ở Client & Nguy cơ Gian Lận (Client-Side Verification & Anti-Cheat):**
   * Phía Backend trả về toàn bộ mảng `cards` có kèm trường `pairId` ngay tại endpoint `GET /start`. Bất kỳ ai mở DevTools hoặc đọc Network response đều biết trước thẻ nào ghép với thẻ nào.
   * Logic kiểm tra mở trúng cặp thẻ được thực thi hoàn toàn ở phía Frontend.
   * Endpoint `POST /finish` hoàn toàn tin tưởng điểm số `totalScore` do Client gửi lên để cộng thẳng vào điểm XP của tài khoản (`user.xpPoints`). Backend chưa có thuật toán kiểm tra tính hợp lý (sanity check) giữa `turns`, `duration` và `totalScore`.

3. **Giới hạn cấu hình số lượng thẻ:**
   * Số lượng cặp từ bị giới hạn chặt chẽ trong khoảng từ **2 đến 12 cặp** ($4 \le \text{thẻ} \le 24$).
   * Mặc định là **6 cặp từ = 12 thẻ**, được tối ưu cho bố cục lưới $3 \times 4$ hoặc $4 \times 3$ trên giao diện điện thoại/web.
   * Nếu bài học (`lessonId`) có số từ vựng ít hơn tham số `limit`, hệ thống sẽ chặn không cho mở ván.

4. **Chưa có bảng dữ liệu lưu lịch sử ván chơi chi tiết:**
   * Kết quả ván chơi chỉ tăng trường `xpPoints` trong bảng `User` và lưu vết qua decorator `@recordActivity` vào bảng `activity_log`.
   * Chưa có bảng dữ liệu `game_sessions` chuyên biệt để phân tích chi tiết hiệu suất của học viên (như thời gian trung bình tìm ra 1 cặp thẻ, số lượt lật sai cho từng từ cụ thể, tỷ lệ hoàn thành ván chơi).
