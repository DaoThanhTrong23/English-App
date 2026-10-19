/**
 * GOOGLE APPS SCRIPT ĐỒNG BỘ TOÀN BỘ 341 TEST CASES VÀO GOOGLE SHEET
 * Hướng dẫn sử dụng:
 * 1. Mở file Google Sheet: https://docs.google.com/spreadsheets/d/1EvdRJjuI5xfPb_B_put6StR6Dq-YLQmE8tkvc_6qFVM/edit
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa code cũ, dán toàn bộ nội dung file này vào và bấm 'Save' (biểu tượng đĩa mềm)
 * 4. Bấm 'Run' (Chạy). Toàn bộ 24 sheets tương ứng 24 modules sẽ được tạo và điền tự động!
 */
function importAllTestCases() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {
  "AI": [
    {
      "TCID": "AI-01a",
      "Test Title": "Chấm điểm bài viết (gradeEssay) thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của AI.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong AI.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AI-01b",
      "Test Title": "Chat với AI Bot tạo session mới thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của AI.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong AI.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AI-02a",
      "Test Title": "Ollama trả về JSON không đúng format ném lỗi cú pháp",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của AI.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong AI.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AI-02b",
      "Test Title": "Lỗi khi lưu tin nhắn chat với session không hợp lệ ném lỗi",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của AI.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong AI.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AI-03",
      "Test Title": "Hai bài viết gửi chấm song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của AI.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong AI.mock.ts",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "AI-05",
      "Test Title": "Mất kết nối Ollama service (ECONNREFUSED) ném lỗi hệ thống",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của AI.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong AI.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AI-IT-01",
      "Test Title": "POST /api/ai/grade-essay chấm bài viết thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/ai/grade-essay.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ text: 'This is a sample essay for testing AI grading feature.' }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "AI-IT-02",
      "Test Title": "POST /api/ai/chat trò chuyện với trợ lý ảo AI",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/ai/chat.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ message: 'Hello AI assistant!' }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "AI-IT-03",
      "Test Title": "POST /api/ai/grade-essay văn bản quá ngắn (< 5 ký tự) trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/ai/grade-essay.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ text: 'Hi' }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "AI-IT-04",
      "Test Title": "POST /api/ai/chat thiếu message trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/ai/chat.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ message: '' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "AI-IT-05",
      "Test Title": "Mất kết nối LLM service khi chấm bài trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ text: 'Valid length paragraph that fails on connection.' }",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "StudentManage": [
    {
      "TCID": "STM-01a",
      "Test Title": "Lấy danh sách học viên có thống kê tiến độ học từ vựng và bài thi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getStudentslist() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc', }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STM-01b",
      "Test Title": "Khóa tài khoản học viên (isLocked = true) và tự động xóa phiên đăng nhập",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, true",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STM-01c",
      "Test Title": "Mở khóa tài khoản học viên (isLocked = false)",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, false",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STM-02a",
      "Test Title": "Khóa tài khoản không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 9999, true",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'student_not_found'."
    },
    {
      "TCID": "STM-02b",
      "Test Title": "Lấy chi tiết học viên không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getStudentDetail() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 9999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'student_not_found'."
    },
    {
      "TCID": "STM-03a",
      "Test Title": "Nhiều Admin cập nhật trạng thái khóa đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, false",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "STM-03b",
      "Test Title": "Đụng độ Cập nhật & Xóa: Admin cập nhật trạng thái khi tài khoản bị xóa đồng thời ném 404",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, true",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STM-03c",
      "Test Title": "Đụng độ giữa Xem chi tiết và Xóa tài khoản: User bị xóa ngay khi đang truy vấn chi tiết",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getStudentDetail() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'student_not_found'."
    },
    {
      "TCID": "STM-03d",
      "Test Title": "Đụng độ Cập nhật tới trước - Xóa xen ngang: Cập nhật không làm vô hiệu hóa việc xóa",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, true",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STM-04",
      "Test Title": "Lỗi khi thu hồi refresh tokens khi khóa tài khoản ném ngoại lệ an toàn",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, true",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STM-05",
      "Test Title": "Mất kết nối DB khi truy vấn danh sách học viên ném lỗi 500",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getStudentslist() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc', }",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STM-AUTH-01",
      "Test Title": "Chặn hành vi khóa tài khoản Admin: Không thể thao túng tài khoản có role khác",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 99, true",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'student_not_found'."
    },
    {
      "TCID": "STM-AUTH-02",
      "Test Title": "Đảm bảo kiểm tra nghiêm ngặt role học viên (role =",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, false",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STM-AUTH-03",
      "Test Title": "Bảo mật phiên: Thu hồi tức thì toàn bộ Refresh Token khi tài khoản bị khóa",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateStudentLockStatus() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 10, true",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STM-IT-AUTH-01",
      "Test Title": "GET /api/admin/students: Học viên (role: user) truy cập danh sách bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-02",
      "Test Title": "GET /api/admin/students/totalStudent: Học viên (role: user) xem tổng số học viên bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students/totalStudent.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-03",
      "Test Title": "GET /api/admin/students/top: Học viên (role: user) xem danh sách top học viên bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students/top.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-04",
      "Test Title": "GET /api/admin/students/:id: Học viên (role: user) xem chi tiết hồ sơ người khác bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students/10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-05",
      "Test Title": "GET /api/admin/students/:id/progress: Học viên (role: user) xem tiến độ từ vựng người khác bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students/10/progress.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-06",
      "Test Title": "GET /api/admin/students/:id/ai-chat: Học viên (role: user) xem lịch sử chat AI người khác bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students/10/ai-chat.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-07",
      "Test Title": "PATCH /api/admin/students/:id/status: Học viên cố tình khóa tài khoản bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/:id/status:.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isLocked: true }",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "STM-IT-AUTH-08",
      "Test Title": "GET /api/admin/students: Request không gửi Token xác thực trả về 401 Unauthorized",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "STM-IT-AUTH-09",
      "Test Title": "PATCH /api/admin/students/:id/status: Request không gửi Token xác thực trả về 401 Unauthorized",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/:id/status:.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isLocked: true }",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "STM-IT-01",
      "Test Title": "GET /api/admin/students trả về danh sách học viên",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students?page=1&limit=10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=1&limit=10",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STM-IT-02",
      "Test Title": "PATCH /api/admin/students/:id/status cập nhật trạng thái khóa tài khoản",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/:id/status.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isLocked: true }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STM-IT-03",
      "Test Title": "PATCH /api/admin/students/:id/status thiếu isLocked trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/:id/status.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{}",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "STM-IT-04",
      "Test Title": "GET /api/admin/students/abc id không phải số trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students/abc.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của StudentManage",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "STM-IT-RACE-01",
      "Test Title": "Đụng độ Cập nhật & Xóa đồng thời: 1 request thành công, 1 request gặp tài khoản đã xóa trả về 404",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/10/status.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isLocked: true }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STM-IT-RACE-02",
      "Test Title": "Gửi 2 request thay đổi trạng thái khóa học viên đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/10/status.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isLocked: false }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STM-IT-RACE-03",
      "Test Title": "Đụng độ Update tới trước - Delete xen ngang: Cập nhật không làm vô hiệu hóa kết quả xóa",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PATCH tới endpoint /api/admin/students/10/status.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isLocked: true }",
      "Result Expect": "HTTP Status: 404. Báo lỗi student_not_found do bản ghi đã bị xóa hoặc không tồn tại."
    },
    {
      "TCID": "STM-IT-05",
      "Test Title": "Mất kết nối DB khi lấy danh sách học viên trả về 500",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/students?page=1&limit=10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=1&limit=10",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "achievement": [
    {
      "TCID": "ACH-01a",
      "Test Title": "Admin lấy danh sách danh hiệu thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getList() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module achievement",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ACH-01b",
      "Test Title": "Đánh giá mở khóa danh hiệu tự động khi đủ XP và Streak",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của achievement.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong achievement.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ACH-02a",
      "Test Title": "Cập nhật danh hiệu không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.update() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999, { title: 'Mới' }",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "ACH-02b",
      "Test Title": "Không mở khóa danh hiệu nếu chưa đủ Streak dù đã đủ XP",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của achievement.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong achievement.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "ACH-03a",
      "Test Title": "Không mở khóa trùng lặp danh hiệu học viên đã sở hữu (Idempotency)",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của achievement.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong achievement.mock.ts",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "ACH-03b",
      "Test Title": "Đánh giá mở khóa liên tiếp/đồng thời: Lần gọi thứ 2 phát hiện đã mở khóa sẽ bỏ qua",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của achievement.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong achievement.mock.ts",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "ACH-03c",
      "Test Title": "Đụng độ Cập nhật & Xóa danh hiệu tại Service: Request update gặp record đã bị xóa ném 404",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.update() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { title: 'Updated' }, 1",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "ACH-05",
      "Test Title": "Mất kết nối DB khi đánh giá danh hiệu không làm chết ứng dụng",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của achievement.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong achievement.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "ACH-AUTH-01",
      "Test Title": "Ghi nhận chính xác ID quản trị viên khi tạo danh hiệu mới",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.create() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: mockCreateAchievementInput, 99",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ACH-AUTH-02",
      "Test Title": "Ghi nhận chính xác ID quản trị viên khi cập nhật và xóa danh hiệu",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.update() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { title: 'Super Title' }, 99",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ACH-IT-AUTH-01",
      "Test Title": "GET /api/admin/achievements: Học viên (role: user) truy cập bị chặn với HTTP 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/achievements.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "ACH-IT-AUTH-02",
      "Test Title": "POST /api/admin/achievements: Học viên (role: user) tạo danh hiệu bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/achievements:.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Hack Achievement', requireXp: 10, requireStreak: 1 }",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "ACH-IT-AUTH-03",
      "Test Title": "PUT /api/admin/achievements/:id: Học viên (role: user) sửa danh hiệu bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PUT tới endpoint /api/admin/achievements/:id:.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Hacked Title' }",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "ACH-IT-AUTH-04",
      "Test Title": "DELETE /api/admin/achievements/:id: Học viên (role: user) xóa danh hiệu bị chặn 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/achievements/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "ACH-IT-AUTH-05",
      "Test Title": "GET /api/admin/achievements: Request không gửi Token xác thực trả về 401 Unauthorized",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/achievements.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "ACH-IT-AUTH-06",
      "Test Title": "DELETE /api/admin/achievements/:id: Request không gửi Token xác thực trả về 401 Unauthorized",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/achievements/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "ACH-IT-01",
      "Test Title": "GET /api/admin/achievements trả về danh sách danh hiệu",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/achievements.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ACH-IT-02",
      "Test Title": "POST /api/admin/achievements tạo danh hiệu mới",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/achievements.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Bậc thầy', requireXp: 1000, requireStreak: 30 }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ACH-IT-03",
      "Test Title": "DELETE /api/admin/achievements/:id xóa danh hiệu thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/achievements/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ACH-IT-04",
      "Test Title": "POST /api/admin/achievements thiếu title trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/achievements.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ requireXp: 100 }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "ACH-IT-05",
      "Test Title": "PUT /api/admin/achievements/:id với id không phải số trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PUT tới endpoint /api/admin/achievements/:id.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Tên mới' }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "ACH-IT-RACE-01",
      "Test Title": "Đụng độ Cập nhật & Xóa đồng thời: 1 request thành công, 1 request gặp danh hiệu đã xóa trả về 404",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/achievements/10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Updated' }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ACH-IT-RACE-02",
      "Test Title": "Đụng độ Update tới trước - Delete xen ngang: Cập nhật không làm vô hiệu hóa kết quả xóa",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint xen.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Title Cập Nhật' }",
      "Result Expect": "HTTP Status: 404. Báo lỗi student_not_found do bản ghi đã bị xóa hoặc không tồn tại."
    },
    {
      "TCID": "ACH-IT-RACE-03",
      "Test Title": "Hai Admin cùng gửi request cập nhật cùng một danh hiệu đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PUT tới endpoint /api/admin/achievements/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Admin 1 update' }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ACH-IT-06",
      "Test Title": "Mất kết nối DB khi lấy danh sách trả về 500",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/achievements.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của achievement",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "activity-log": [
    {
      "TCID": "LOG-01a",
      "Test Title": "Lấy danh sách lịch sử hoạt động có phân trang",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getActivities() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "LOG-01b",
      "Test Title": "Lấy danh sách lịch sử đăng nhập có phân trang",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getLoginLogs() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "LOG-02",
      "Test Title": "Tìm kiếm không có kết quả trả về mảng rỗng và totalItems = 0",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getActivities() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20, 'unknown_keyword'",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "LOG-AUTH-01",
      "Test Title": "Bảo mật dữ liệu: Lọc nhật ký hoạt động theo actionType và phân quyền quản trị viên",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getActivities() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20, undefined, 'ADMIN_UPDATE'",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "LOG-AUTH-02",
      "Test Title": "Bảo mật dữ liệu: Nhật ký đăng nhập ghi nhận đầy đủ địa chỉ IP và thông tin xác thực",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getLoginLogs() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20, '127.0.0.1'",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "LOG-05",
      "Test Title": "Mất kết nối DB khi truy vấn logs ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getActivities() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "LOG-IT-AUTH-01",
      "Test Title": "GET /api/admin/logs/activities: Học viên (role: user) truy cập bị chặn với HTTP 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/activities.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của activity-log",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "LOG-IT-AUTH-02",
      "Test Title": "GET /api/admin/logs/login-logs: Học viên (role: user) truy cập bị chặn với HTTP 403 Forbidden",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/login-logs.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của activity-log",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "LOG-IT-AUTH-03",
      "Test Title": "GET /api/admin/logs/activities: Request không gửi Token xác thực trả về 401 Unauthorized",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/activities.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của activity-log",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "LOG-IT-AUTH-04",
      "Test Title": "GET /api/admin/logs/login-logs: Request không gửi Token xác thực trả về 401 Unauthorized",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/login-logs.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của activity-log",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "LOG-IT-01",
      "Test Title": "GET /api/admin/logs/activities trả về danh sách lịch sử hoạt động",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/activities?page=1&limit=20.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=1&limit=20",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "LOG-IT-02",
      "Test Title": "GET /api/admin/logs/login-logs trả về danh sách lịch sử đăng nhập",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/login-logs.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của activity-log",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "LOG-IT-03",
      "Test Title": "GET /api/admin/logs/activities với page âm hoặc không hợp lệ trả về kết quả an toàn",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/activities?page=-1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=-1",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "LOG-IT-04",
      "Test Title": "Mất kết nối DB khi truy vấn login logs trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/logs/login-logs.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của activity-log",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "auth": [
    {
      "TCID": "AUTH-01",
      "Test Title": "Đăng nhập thành công với thông tin hợp lệ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AUTH-01b",
      "Test Title": "Đăng ký thành công tài khoản mới",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AUTH-01c",
      "Test Title": "Đăng xuất thành công thu hồi refresh token và access token",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AUTH-03a",
      "Test Title": "Đăng nhập thất bại do sai mật khẩu",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AUTH-03b",
      "Test Title": "Đăng nhập thất bại do người dùng không tồn tại",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AUTH-04",
      "Test Title": "Từ chối đăng nhập nếu tài khoản bị khóa (isLocked = true)",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 403, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AUTH-04b",
      "Test Title": "Từ chối refresh token nếu tài khoản đã bị khóa",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 403, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AUTH-05",
      "Test Title": "Phát hiện đụng độ / replay refresh token: >= 3 lần refresh/phút hủy toàn bộ phiên",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 429, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AUTH-06",
      "Test Title": "Xung đột dữ liệu: Chặn đăng ký khi trùng Email đã tồn tại",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 409, mã lỗi 'email_already_exists'."
    },
    {
      "TCID": "AUTH-06b",
      "Test Title": "Xung đột dữ liệu: Chặn đăng ký khi trùng Tên đăng nhập",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 409, mã lỗi 'username_already_exists'."
    },
    {
      "TCID": "AUTH-07",
      "Test Title": "Xung đột Token: Sử dụng Refresh Token đã bị thu hồi (isRevoked = true) lập tức thu hồi cả session",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 401, mã lỗi 'token_revoked'."
    },
    {
      "TCID": "AUTH-09",
      "Test Title": "Xử lý an toàn khi mất kết nối DB lúc login",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "AUTH-SEC-01",
      "Test Title": "Thu hồi Session an toàn: Logout đưa Access Token vào danh sách đen (revoked_token) và đánh dấu Refresh Token isRevoked = true",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AUTH-SEC-02",
      "Test Title": "Chống Replay Refresh Token: Kẻ tấn công dùng Refresh Token đã bị revoke để lấy token mới -> Bị từ chối 401 và toàn bộ Session bị triệt hạ",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 401, mã lỗi 'token_revoked'."
    },
    {
      "TCID": "AUTH-SEC-03",
      "Test Title": "Chống dùng lại Access Token cũ sau khi Refresh (Token Rotation): Access Token cũ trước đó bị đưa vào blacklist ngay lập tức",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "AUTH-SEC-04",
      "Test Title": "Phát hiện tấn công Brute-force/Spam Refresh: Hủy tức thì toàn bộ Session và đưa cả Access Token lẫn Refresh Token vào blacklist khi tần suất >= 3 lần/phút",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 429, mã lỗi 'too_many_refresh_requests'."
    },
    {
      "TCID": "AUTH-SEC-05",
      "Test Title": "Ngăn chặn phiên làm việc của tài khoản bị khóa: Refresh token của user có isLocked = true bị từ chối 403 account_locked",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của auth.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong auth.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 403, mã lỗi 'account_locked'."
    },
    {
      "TCID": "AUTH-IT-01",
      "Test Title": "POST /api/auth/register thành công với mã 201",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/register.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ username: 'validuser', email: 'valid@example.com', password: 'Password123@', }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "AUTH-IT-02",
      "Test Title": "POST /api/auth/login thành công với mã 200",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/login.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ identifier: 'valid@example.com', password: 'Password123@', }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "AUTH-IT-02b",
      "Test Title": "POST /api/auth/logout thành công khi gửi đúng token hợp lệ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/logout.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ refreshToken: 'valid_refresh_token' }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "AUTH-IT-03",
      "Test Title": "POST /api/auth/login thiếu mật khẩu trả về 422 Validation Error",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/login.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ identifier: 'valid@example.com', }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "AUTH-IT-04",
      "Test Title": "POST /api/auth/register email không đúng định dạng trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/register.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ username: 'invalidmail', email: 'not-an-email', password: 'Password123@', }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "AUTH-IT-04b",
      "Test Title": "POST /api/auth/logout không gửi header Authorization trả về 401",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/logout.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ refreshToken: 'some_refresh_token' }",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "AUTH-IT-SEC-01",
      "Test Title": "Kẻ tấn công dùng Access Token đã bị thu hồi (đã logout) -> Bị Authenticate middleware chặn với HTTP 401 token_revoked",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ refreshToken: 'any_refresh' }",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "AUTH-IT-SEC-02",
      "Test Title": "Kẻ tấn công dùng Refresh Token từ session đã bị thu hồi gọi POST /api/auth/refresh -> Bị chặn với HTTP 401 token_revoked",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/refresh.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ refreshToken: 'revoked_session_refresh_token' }",
      "Result Expect": "HTTP Status: 401. Báo lỗi unauthorized do chưa cung cấp token xác thực."
    },
    {
      "TCID": "AUTH-IT-SEC-03",
      "Test Title": "Kẻ tấn công spam Refresh Token > 3 lần/phút -> Hệ thống kích hoạt phòng vệ chặn 429 và hủy toàn bộ phiên",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ refreshToken: 'spam_refresh_token' }",
      "Result Expect": "HTTP Status: 429. "
    },
    {
      "TCID": "AUTH-IT-SEC-04",
      "Test Title": "Kẻ tấn công dùng Token hợp lệ nhưng tài khoản vừa bị Admin khóa -> Bị chặn với HTTP 403 account_locked ngay lập tức",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ refreshToken: 'any_refresh' }",
      "Result Expect": "HTTP Status: 403. Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị."
    },
    {
      "TCID": "AUTH-IT-06",
      "Test Title": "POST /api/auth/register khi email đã tồn tại trả về 409 Conflict",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/register.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ username: 'newuser', email: 'existing@example.com', password: 'Password123@', }",
      "Result Expect": "HTTP Status: 409. "
    },
    {
      "TCID": "AUTH-IT-07",
      "Test Title": "POST /api/auth/login khi DB mất kết nối trả về 500 lỗi máy chủ",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/auth/login.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ identifier: 'user@example.com', password: 'Password123@', }",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "bubble-game": [
    {
      "TCID": "BBG-01a",
      "Test Title": "Khởi tạo bàn chơi game bong bóng thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4, lessonId: 1 }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "BBG-01b",
      "Test Title": "Lưu tiến trình tạm thời (match pair) thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.matchPair() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockMatchPairInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "BBG-01c",
      "Test Title": "Kết thúc ván chơi và chốt điểm",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.finishGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockFinishGameInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "BBG-02a",
      "Test Title": "Khởi tạo game khi không đủ từ vựng (< 4 từ) ném lỗi 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "BBG-02b",
      "Test Title": "Khởi tạo game khi danh sách từ vựng rỗng/null ném lỗi 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "BBG-03",
      "Test Title": "Hai request chốt điểm finishGame gửi đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.finishGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockFinishGameInput",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "BBG-05",
      "Test Title": "Mất kết nối DB khi lưu tiến trình ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.matchPair() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockMatchPairInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "BBG-IT-01",
      "Test Title": "GET /api/bubble-game/start bắt đầu ván chơi thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/bubble-game/start?limit=4.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=4",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "BBG-IT-02",
      "Test Title": "POST /api/bubble-game/match lưu tiến trình tạm thời",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/bubble-game/match.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockMatchPairInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "BBG-IT-03",
      "Test Title": "POST /api/bubble-game/finish chốt kết quả kết thúc ván",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/bubble-game/finish.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockFinishGameInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "BBG-IT-04",
      "Test Title": "GET /api/bubble-game/start với limit < 4 trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/bubble-game/start?limit=2.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=2",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "BBG-IT-05",
      "Test Title": "POST /api/bubble-game/match thiếu currentScore trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/bubble-game/match.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ matchedPairs: 2, totalPairs: 4 }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "BBG-IT-06",
      "Test Title": "Lỗi database khi kết thúc ván trả về 500",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockFinishGameInput",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "community": [
    {
      "TCID": "COM-01a",
      "Test Title": "Lấy danh sách bài viết có phân trang và trạng thái like",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getPosts() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, 10",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "COM-01b",
      "Test Title": "Đăng bài viết mới thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createPost() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 'Học xong bài mới', '/image.png', true",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "COM-01c",
      "Test Title": "Toggle like (thích bài viết chưa like)",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.toggleLike() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "COM-01d",
      "Test Title": "Toggle like (bỏ thích bài viết đã like)",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.toggleLike() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "COM-01e",
      "Test Title": "Viết bình luận vào bài viết thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createComment() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 2, 1, 'Bình luận hay'",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "COM-02a",
      "Test Title": "Bình luận vào bài viết không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createComment() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 999, 'Nội dung'",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "COM-02b",
      "Test Title": "Chỉnh sửa bài viết của người khác ném lỗi 403",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updatePost() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, { content: 'Hack content' }",
      "Result Expect": "Ném ngoại lệ ApiError với status 403, mã lỗi 'forbidden'."
    },
    {
      "TCID": "COM-02c",
      "Test Title": "Xóa bài viết của người khác ném lỗi 403",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.deletePost() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1",
      "Result Expect": "Ném ngoại lệ ApiError với status 403, mã lỗi 'forbidden'."
    },
    {
      "TCID": "COM-03",
      "Test Title": "Hai request toggle like đồng thời xử lý nhất quán",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.toggleLike() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "COM-05",
      "Test Title": "Mất kết nối DB khi lấy danh sách posts ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getPosts() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, 10",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "COM-IT-01",
      "Test Title": "GET /api/community/posts lấy danh sách bài viết",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/community/posts?page=1&limit=10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=1&limit=10",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "COM-IT-02",
      "Test Title": "POST /api/community/posts tạo bài viết mới",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/community/posts.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ content: 'Bài viết chia sẻ kiến thức' }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "COM-IT-03",
      "Test Title": "POST /api/community/posts/:id/like toggle like bài viết",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/community/posts/1/like.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của community",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "COM-IT-04",
      "Test Title": "POST /api/community/posts/:id/comments thêm bình luận",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/community/posts/:id/comments.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ content: 'Hay quá bạn ơi' }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "COM-IT-05",
      "Test Title": "POST /api/community/posts không có content và image trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/community/posts.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ content: '' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "COM-IT-06",
      "Test Title": "POST /api/community/posts/:id/comments nội dung rỗng trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/community/posts/:id/comments.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ content: '' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "COM-IT-07",
      "Test Title": "Mất kết nối database khi lấy danh sách bài viết trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/community/posts.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của community",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "course": [
    {
      "TCID": "CRS-01a",
      "Test Title": "Lấy danh sách bài học có phân trang",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getCoursesList() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: { page: 1, limit: 10 } as any",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "CRS-01b",
      "Test Title": "Tạo bài học mới và kiểm tra từ vựng tồn tại",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: mockCreateCourseInput as any",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "CRS-01c",
      "Test Title": "Xóa mềm (soft-delete) bài học",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.softDeleteCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "CRS-02",
      "Test Title": "Tạo bài học với wordIds không tồn tại ném lỗi 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: { ...mockCreateCourseInput, wordIds: [9999] } as any",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'invalid_word_ids'."
    },
    {
      "TCID": "CRS-03",
      "Test Title": "Nhiều request xóa mềm và khôi phục song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.restoreCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "CRS-05",
      "Test Title": "Mất kết nối DB khi tạo bài học ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: mockCreateCourseInput as any",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "CRS-IT-01",
      "Test Title": "GET /api/admin/courses trả về danh sách bài học",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/courses?page=1&limit=10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=1&limit=10",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "CRS-IT-02",
      "Test Title": "DELETE /api/admin/courses/:id xóa mềm bài học",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/courses/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của course",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "CRS-IT-03",
      "Test Title": "DELETE /api/admin/courses/abc id không phải số trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/courses/abc.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của course",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "CRS-IT-04",
      "Test Title": "Mất kết nối DB khi lấy danh sách trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/courses?page=1&limit=10.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: page=1&limit=10",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "dashboard": [
    {
      "TCID": "DSB-01",
      "Test Title": "Tổng hợp số liệu thống kê Dashboard chính xác",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getDashboardStats() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module dashboard",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "DSB-02",
      "Test Title": "Hệ thống chưa có dữ liệu (0 bản ghi) xử lý an toàn",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getDashboardStats() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module dashboard",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "DSB-03",
      "Test Title": "Nhiều Admin cùng xem Dashboard đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getDashboardStats() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module dashboard",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "DSB-05",
      "Test Title": "Mất kết nối DB khi truy vấn Dashboard ném lỗi 500",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getDashboardStats() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module dashboard",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "DSB-IT-01",
      "Test Title": "GET /api/admin/dashboard/stats trả về 200 kèm thống kê hệ thống",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/dashboard/stats.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của dashboard",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "DSB-IT-02",
      "Test Title": "Mất kết nối DB khi tải Dashboard trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/dashboard/stats.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của dashboard",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "game": [
    {
      "TCID": "GAME-01a",
      "Test Title": "Lấy danh sách game hỗ trợ thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getAllGames() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module game",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "GAME-01b",
      "Test Title": "Cập nhật settings cho game",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateSettings() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] as any, }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "GAME-01c",
      "Test Title": "Lấy lịch sử và thống kê game của user",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getHistory() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "GAME-01d",
      "Test Title": "Chuẩn bị bàn chơi game (play)",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.play() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'bubble_burst', 'EASY', 'A1'",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "GAME-02a",
      "Test Title": "Cập nhật settings cho game không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateSettings() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999, { settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: 10 }] as any, }",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "GAME-02b",
      "Test Title": "Play game không tồn tại code ném 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.play() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'invalid_code', 'EASY', 'A1'",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "GAME-02c",
      "Test Title": "Play game với độ khó chưa cấu hình ném 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.play() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'bubble_burst', 'EXTREME', 'A1'",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "GAME-05",
      "Test Title": "Mất kết nối database khi truy vấn từ vựng ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.play() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'bubble_burst', 'EASY', 'A1'",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "GAME-IT-01",
      "Test Title": "GET /api/games/history lấy lịch sử chơi của user",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/games/history.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của game",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "GAME-IT-02",
      "Test Title": "GET /api/games/:code/play lấy dữ liệu ván chơi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/games/bubble_burst/play?difficulty=EASY.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: difficulty=EASY",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "GAME-IT-03",
      "Test Title": "GET /api/games/admin lấy danh sách game cho admin",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/games/admin.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của game",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "GAME-IT-04",
      "Test Title": "PUT /api/games/admin/:id/settings với danh sách rỗng trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PUT tới endpoint /api/games/admin/:id/settings.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ settings: [] }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "GAME-IT-05",
      "Test Title": "Mất kết nối database khi lấy history trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/games/history.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của game",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "keyword-setting": [
    {
      "TCID": "KWS-01a",
      "Test Title": "Lấy danh sách nhóm từ khóa và từ điển đồng nghĩa thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getAll() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module keyword-setting",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "KWS-01b",
      "Test Title": "Tạo nhóm từ khóa mới và loại bỏ các từ trùng lặp",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createGroup() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'Khoa học vũ trụ', ['vũ trụ', 'sao', 'vũ trụ', 'hành tinh']",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "KWS-01c",
      "Test Title": "Cập nhật và xóa nhóm từ khóa thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createGroup() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'Tạm thời để xóa', ['a', 'b']",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "KWS-02a",
      "Test Title": "Tạo nhóm với tên rỗng ném lỗi 400 bad_request",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createGroup() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: ' ', ['a']",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "KWS-02b",
      "Test Title": "Xóa nhóm không tồn tại ném lỗi 404 not_found",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.deleteGroup() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'non_existent_id_9999'",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "KWS-03",
      "Test Title": "Thêm nhiều nhóm liên tiếp bảo toàn mảng dữ liệu trong bộ nhớ",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createGroup() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'Nhóm Song Song 1', ['a']",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "KWS-04",
      "Test Title": "Chặn tạo nhóm trùng tên với nhóm đã tồn tại (case-insensitive)",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createGroup() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'CÔNG NGHỆ (IT",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'duplicate'."
    },
    {
      "TCID": "KWS-05",
      "Test Title": "Đường dẫn file CSV được khởi tạo hợp lệ",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getCsvFilePath() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module keyword-setting",
      "Result Expect": "Ném ngoại lệ lỗi kết nối hoặc Rollback Transaction, không lưu dữ liệu rác."
    },
    {
      "TCID": "KWS-IT-01",
      "Test Title": "GET /api/admin/keywords trả về danh sách nhóm từ khóa",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/keywords.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của keyword-setting",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "KWS-IT-02",
      "Test Title": "POST /api/admin/keywords tạo nhóm từ khóa mới",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/keywords.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ group: 'Khoa học', keywords: ['science', 'research'] }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "KWS-IT-03",
      "Test Title": "DELETE /api/admin/keywords/:id xóa nhóm từ khóa",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/keywords/kw-1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của keyword-setting",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "KWS-IT-04",
      "Test Title": "POST /api/admin/keywords tạo nhóm trùng tên trả về 400 duplicate",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/keywords.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ group: 'Trùng', keywords: ['a'] }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "KWS-IT-05",
      "Test Title": "2 request thêm nhóm song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/keywords.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ group: 'G1', keywords: ['a'] }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    }
  ],
  "leaderboard": [
    {
      "TCID": "LDB-01",
      "Test Title": "Lấy bảng xếp hạng Top học viên và tính đúng thứ hạng cá nhân",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getLeaderboard() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 3, 20",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "LDB-02",
      "Test Title": "Người dùng không tồn tại trả về rank = 0 an toàn",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getLeaderboard() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 9999, 20",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "LDB-03",
      "Test Title": "Nhiều học viên cùng tải bảng xếp hạng song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getLeaderboard() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 10",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "LDB-05",
      "Test Title": "Mất kết nối DB khi lấy BXH ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getLeaderboard() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 20",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "LDB-IT-01",
      "Test Title": "GET /api/student/leaderboard trả về 200 kèm top học viên",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/leaderboard.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của leaderboard",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "LDB-IT-02",
      "Test Title": "Mất kết nối DB khi lấy BXH trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/leaderboard.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của leaderboard",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "mario-game": [
    {
      "TCID": "MARIO-01a",
      "Test Title": "Khởi tạo game Mario thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4, lessonId: 2 }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "MARIO-01b",
      "Test Title": "Lưu tiến trình tạm thời thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.matchPair() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockMarioMatchPairInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "MARIO-01c",
      "Test Title": "Kết thúc ván Mario và chốt điểm",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.finishGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockMarioFinishGameInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "MARIO-02a",
      "Test Title": "Khởi tạo Mario game khi không đủ từ vựng (< 4 từ) ném 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "MARIO-02b",
      "Test Title": "Khởi tạo game khi repository trả về null ném 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "MARIO-03",
      "Test Title": "Hai request chốt điểm finishGame gửi đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.finishGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockMarioFinishGameInput",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "MARIO-05",
      "Test Title": "Mất kết nối DB khi lưu tiến trình ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.matchPair() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockMarioMatchPairInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "MARIO-IT-01",
      "Test Title": "GET /api/mario-game/start bắt đầu ván chơi Mario thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/mario-game/start?limit=4.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=4",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "MARIO-IT-02",
      "Test Title": "POST /api/mario-game/match lưu tiến trình tạm thời",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/mario-game/match.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockMarioMatchPairInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "MARIO-IT-03",
      "Test Title": "POST /api/mario-game/finish chốt kết quả game",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/mario-game/finish.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockMarioFinishGameInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "MARIO-IT-04",
      "Test Title": "GET /api/mario-game/start với limit < 4 trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/mario-game/start?limit=1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=1",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "MARIO-IT-05",
      "Test Title": "POST /api/mario-game/match điểm số âm trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/mario-game/match.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ ...mockMarioMatchPairInput, currentScore: -10 }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "MARIO-IT-06",
      "Test Title": "Lỗi database khi kết thúc ván trả về 500",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockMarioFinishGameInput",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "memory-card": [
    {
      "TCID": "MEM-01a",
      "Test Title": "Khởi tạo game lật thẻ tạo đủ 12 thẻ từ 6 từ vựng",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 6, lessonId: 1 }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "MEM-01b",
      "Test Title": "Lưu tiến trình lật thẻ thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.saveProgress() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockSaveMemoryProgressInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "MEM-01c",
      "Test Title": "Chốt kết quả ván chơi lật thẻ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.finishGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockFinishMemoryInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "MEM-02a",
      "Test Title": "Khởi tạo ván chơi khi thiếu từ vựng (< limit) ném lỗi 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 6 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "MEM-02b",
      "Test Title": "Khởi tạo khi repository trả về mảng rỗng ném lỗi 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 6 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "MEM-03",
      "Test Title": "Hai request chốt điểm Memory Card song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.finishGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockFinishMemoryInput",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "MEM-05",
      "Test Title": "Mất kết nối database khi lưu tiến trình ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.saveProgress() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockSaveMemoryProgressInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "MEM-IT-01",
      "Test Title": "GET /api/memory-card/start khởi tạo bàn chơi lật thẻ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/memory-card/start?limit=6.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=6",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "MEM-IT-02",
      "Test Title": "POST /api/memory-card/progress cập nhật tiến trình",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/memory-card/progress.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockSaveMemoryProgressInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "MEM-IT-03",
      "Test Title": "POST /api/memory-card/finish chốt kết quả ván chơi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/memory-card/finish.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockFinishMemoryInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "MEM-IT-04",
      "Test Title": "GET /api/memory-card/start limit không hợp lệ trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/memory-card/start?limit=1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=1",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "MEM-IT-05",
      "Test Title": "POST /api/memory-card/progress turns âm trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/memory-card/progress.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ ...mockSaveMemoryProgressInput, turns: -1 }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "MEM-IT-06",
      "Test Title": "Lỗi database khi kết thúc ván trả về 500",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockFinishMemoryInput",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "notification": [
    {
      "TCID": "NTF-01a",
      "Test Title": "Lấy danh sách thông báo và số lượng chưa đọc chính xác",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getNotifications() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "NTF-01b",
      "Test Title": "Đánh dấu thông báo đã đọc",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.markAsRead() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "NTF-01c",
      "Test Title": "Đánh dấu tất cả thông báo là đã đọc",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.markAllAsRead() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "NTF-01d",
      "Test Title": "Gửi thông báo đến toàn bộ Admin",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.notifyAdmins() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'Cảnh báo hệ thống', 'Phát hiện sự cố'",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "NTF-02",
      "Test Title": "Đánh dấu thông báo không thuộc quyền sở hữu (IDOR check: userId khác) không làm ảnh hưởng bản ghi",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.markAsRead() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999, 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "NTF-03",
      "Test Title": "Nhiều tiến trình cùng gửi thông báo cho Admin đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.notifyAdmins() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'T1', 'B1'",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "NTF-05",
      "Test Title": "Mất kết nối DB khi lấy danh sách thông báo ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getNotifications() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "NTF-IT-01",
      "Test Title": "GET /api/notifications trả về danh sách thông báo và số lượng chưa đọc",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/notifications.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của notification",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "NTF-IT-02",
      "Test Title": "PUT /api/notifications/read-all đánh dấu tất cả đã đọc",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP PUT tới endpoint /api/notifications/read-all.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của notification",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "NTF-IT-03",
      "Test Title": "DELETE /api/notifications/clear-all xóa toàn bộ thông báo",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/notifications/clear-all.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của notification",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "NTF-IT-05",
      "Test Title": "Mất kết nối DB khi lấy thông báo trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/notifications.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của notification",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "onboarding": [
    {
      "TCID": "ONB-01a",
      "Test Title": "Lấy danh sách câu hỏi phân loại đầu vào FAME-KT đa kỹ năng",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ONB-01b",
      "Test Title": "Hoàn tất Onboarding: Tính toán Elo đa chiều và cập nhật CEFR Level",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ONB-01c",
      "Test Title": "Kiểm tra hội tụ sớm (checkProgress) khi học viên làm bài",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ONB-02",
      "Test Title": "Gửi danh sách câu hỏi không có id khớp trong ngân hàng câu hỏi",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "ONB-03",
      "Test Title": "Nhiều học viên Onboarding song song không làm sai lệch ngân hàng câu hỏi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "ONB-04",
      "Test Title": "Người dùng không có sở thích nào vẫn gợi ý khóa học an toàn (fallback)",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "ONB-05",
      "Test Title": "Mất kết nối DB khi cập nhật kết quả user ném lỗi hệ thống",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của onboarding.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong onboarding.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "ONB-IT-01",
      "Test Title": "GET /api/onboarding/placement-test trả về 200 kèm danh sách câu hỏi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/onboarding/placement-test.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của onboarding",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ONB-IT-02",
      "Test Title": "POST /api/onboarding/submit hoàn tất Onboarding thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/onboarding/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ job: 'Designer', interests: 'Art', answers: [{ id: 'q1', answer: 'A', timeTakenMs: 2000 }], }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ONB-IT-03",
      "Test Title": "POST /api/onboarding/check-progress kiểm tra điều kiện dừng sớm",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/onboarding/check-progress.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ answers: [{ id: 'q1', answer: 'A', timeTakenMs: 2000 }], }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ONB-IT-04",
      "Test Title": "POST /api/onboarding/submit thiếu answers trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/onboarding/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ job: 'Designer', interests: 'Art', // thiếu answers }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "ONB-IT-05",
      "Test Title": "POST /api/onboarding/check-progress answers không phải mảng trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/onboarding/check-progress.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ answers: 'not_an_array', }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "ONB-IT-06",
      "Test Title": "Gửi 2 request submit đồng thời đều nhận được phản hồi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/onboarding/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ job: 'Dev', interests: 'IT', answers: [{ id: '1', answer: 'A' }] }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "ONB-IT-07",
      "Test Title": "Mất kết nối DB khi processOnboarding trả về 500 lỗi máy chủ",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ job: 'Dev', interests: 'IT', answers: [{ id: '1', answer: 'A' }] }",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "quest": [
    {
      "TCID": "QST-01",
      "Test Title": "Tính toán tiến độ các nhiệm vụ hôm nay chính xác",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của quest.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong quest.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "QST-02",
      "Test Title": "Từ chối nhận thưởng khi nhiệm vụ chưa hoàn thành mục tiêu",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của quest.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong quest.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "QST-03",
      "Test Title": "Chặn nhận thưởng lần 2 nếu activityLog đã ghi nhận claim hôm nay",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của quest.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong quest.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "QST-04",
      "Test Title": "Rollback transaction nếu ghi activityLog thất bại khi cộng XP",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của quest.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong quest.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "QST-05",
      "Test Title": "Xử lý lỗi ngắt kết nối DB khi đếm tiến độ nhiệm vụ",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của quest.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong quest.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "QST-IT-01",
      "Test Title": "GET /api/student/quests/daily trả về danh sách nhiệm vụ và tiến độ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/quests/daily.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của quest",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "QST-IT-02",
      "Test Title": "POST /api/student/quests/claim nhận thưởng thành công nhiệm vụ login",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/quests/claim.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ questId: 'quest_login' }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "QST-IT-03",
      "Test Title": "POST /api/student/quests/claim questId không hợp lệ trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/quests/claim.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ questId: 'invalid_quest_123' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "QST-IT-04",
      "Test Title": "POST /api/student/quests/claim chưa hoàn thành mục tiêu trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/quests/claim.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ questId: 'quest_test' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "QST-IT-05",
      "Test Title": "POST /api/student/quests/claim đã nhận hôm nay trả về 400",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/quests/claim.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ questId: 'quest_login' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "QST-IT-06",
      "Test Title": "Lỗi kết nối DB trong transaction trả về 500 lỗi máy chủ",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ questId: 'quest_login' }",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "student-lesson": [
    {
      "TCID": "STL-01a",
      "Test Title": "Hoàn thành bài học lần đầu được cộng +20 XP",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.completeLesson() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 101",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STL-01b",
      "Test Title": "Đăng ký chủ đề học (enrollCourse) thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.enrollCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STL-02a",
      "Test Title": "Hoàn thành bài học không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.completeLesson() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 9999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STL-02b",
      "Test Title": "Đăng ký chủ đề không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.enrollCourse() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 9999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STL-03",
      "Test Title": "Chống bug farm XP: Hoàn thành lại bài học đã học trước đó nhận +0 XP",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.completeLesson() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 101",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "STL-05",
      "Test Title": "Mất kết nối DB khi cộng XP ném lỗi máy chủ",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.completeLesson() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 101",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STL-IT-01",
      "Test Title": "GET /api/student/courses trả về 200 kèm danh sách khóa học",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/courses.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-lesson",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STL-IT-02",
      "Test Title": "POST /api/student/lessons/:id/complete hoàn thành bài học và nhận XP",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/lessons/101/complete.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-lesson",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STL-IT-03",
      "Test Title": "GET /api/student/lessons/abc truyền param không phải số trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/lessons/abc.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-lesson",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "STL-IT-04",
      "Test Title": "POST /api/student/lessons/999/complete không tìm thấy bài học trả về 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/lessons/999/complete.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-lesson",
      "Result Expect": "HTTP Status: 404. Báo lỗi student_not_found do bản ghi đã bị xóa hoặc không tồn tại."
    },
    {
      "TCID": "STL-IT-05",
      "Test Title": "2 request hoàn thành bài học đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/lessons/101/complete.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-lesson",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STL-IT-06",
      "Test Title": "Lỗi kết nối DB trả về 500 lỗi máy chủ",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/lessons/101/complete.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-lesson",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "student-test": [
    {
      "TCID": "STT-01a",
      "Test Title": "Lấy chi tiết bài kiểm tra thành công (ẩn đáp án đúng)",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getTestDetail() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STT-01b",
      "Test Title": "Nộp bài thi lần đầu: chấm đúng 2 câu, cập nhật Elo & XP",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, mockTestSubmission",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STT-01c",
      "Test Title": "Nộp bài thi thi lại (retake): chống cày điểm (xpGained = 0)",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, mockTestSubmission",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STT-02a",
      "Test Title": "Nộp bài kiểm tra không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 999, mockTestSubmission",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'test_not_found'."
    },
    {
      "TCID": "STT-02b",
      "Test Title": "Nộp bài với user không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999, 1, mockTestSubmission",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'user_not_found'."
    },
    {
      "TCID": "STT-02c",
      "Test Title": "Lấy chi tiết bài kiểm tra không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getTestDetail() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'test_not_found'."
    },
    {
      "TCID": "STT-03",
      "Test Title": "Hai yêu cầu nộp bài đồng thời cùng lúc",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, mockTestSubmission",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "STT-05",
      "Test Title": "Mất kết nối database khi nộp bài thi ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 1, mockTestSubmission",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STT-IT-01",
      "Test Title": "GET /api/student/tests/:id lấy chi tiết bài thi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/tests/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-test",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STT-IT-02",
      "Test Title": "POST /api/student/tests/:id/submit nộp bài thi thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/tests/:id/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ submissions: mockTestSubmission }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STT-IT-03",
      "Test Title": "POST /api/student/tests/:id/submit submissions không phải array trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/tests/:id/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ submissions: 'invalid' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "STT-IT-04",
      "Test Title": "Lỗi database khi nộp bài thi trả về 500",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ submissions: mockTestSubmission }",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "student-vocabulary": [
    {
      "TCID": "STV-01a",
      "Test Title": "Lấy danh sách từ vựng cá nhân kèm phân trang lazy loading",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getVocabularyList() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 10 }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STV-01b",
      "Test Title": "Thêm từ vựng có sẵn vào danh sách học viên thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.addVocabulary() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { wordId: 10, status: 'new' }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STV-01c",
      "Test Title": "Thuật toán SRS: Ôn tập đúng tăng memoryLevel và dời lịch theo khoảng cách ngày",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitReview() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 10, true",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "STV-01d",
      "Test Title": "Thuật toán SRS: Ôn tập sai giảm memoryLevel an toàn không bị âm",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitReview() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 10, false",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STV-02a",
      "Test Title": "Xem chi tiết từ vựng không tồn tại hoặc của học viên khác (IDOR) ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getVocabularyDetail() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STV-02b",
      "Test Title": "Thêm từ vựng với wordId không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.addVocabulary() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { wordId: 999, status: 'new' }",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STV-03",
      "Test Title": "Nộp ôn tập song song nhiều từ vựng được thực thi an toàn",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitReview() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 10, true",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "STV-04",
      "Test Title": "Chặn thêm từ vựng đã có sẵn trong danh sách của học viên (409 word_already_added)",
      "Test Summary": "Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.addVocabulary() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { wordId: 10, status: 'new' }",
      "Result Expect": "Ném ngoại lệ ApiError với status 409, mã lỗi 'word_already_added'."
    },
    {
      "TCID": "STV-05",
      "Test Title": "Mất kết nối DB khi nộp ôn tập rollback transaction sạch sẽ",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitReview() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, 10, true",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "STV-IT-01",
      "Test Title": "GET /api/student/vocabulary trả về 200 kèm danh sách từ vựng",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/vocabulary.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-vocabulary",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STV-IT-02",
      "Test Title": "POST /api/student/vocabulary thêm từ vựng thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/vocabulary.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ wordId: 10 }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STV-IT-03",
      "Test Title": "POST /api/student/vocabulary/reviews nộp kết quả ôn tập thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/vocabulary/reviews.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ wordId: 10, isCorrect: true }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STV-IT-04",
      "Test Title": "POST /api/student/vocabulary/reviews thiếu wordId trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/vocabulary/reviews.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ isCorrect: true }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "STV-IT-05",
      "Test Title": "GET /api/student/vocabulary/999 không tìm thấy trả về 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/vocabulary/999.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-vocabulary",
      "Result Expect": "HTTP Status: 404. Báo lỗi student_not_found do bản ghi đã bị xóa hoặc không tồn tại."
    },
    {
      "TCID": "STV-IT-06",
      "Test Title": "Gửi 2 request ôn tập song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/student/vocabulary/reviews.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ wordId: 10, isCorrect: true }",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "STV-IT-07",
      "Test Title": "Thêm từ đã có sẵn trả về 409 Conflict",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ wordId: 10 }",
      "Result Expect": "HTTP Status: 409. "
    },
    {
      "TCID": "STV-IT-08",
      "Test Title": "Mất kết nối DB khi lấy danh sách trả về 500",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/student/vocabulary.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của student-vocabulary",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "test": [
    {
      "TCID": "TST-01a",
      "Test Title": "Lấy danh sách bài thi thành công theo level & search",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getAllTests() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 'B1', 'Kiểm tra', 10",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TST-01b",
      "Test Title": "Tạo bài thi mới thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: mockCreateTestInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TST-01c",
      "Test Title": "Thêm câu hỏi và đáp án vào bài thi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.addQuestion() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockCreateQuestionInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TST-01d",
      "Test Title": "Xóa bài thi thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.deleteTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TST-02a",
      "Test Title": "Update bài thi không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999, { title: 'New Title' }",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "TST-02b",
      "Test Title": "Thêm câu hỏi vào bài thi không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.addQuestion() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999, mockCreateQuestionInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "TST-02c",
      "Test Title": "Lấy danh sách câu hỏi của bài thi không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getQuestions() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'not_found'."
    },
    {
      "TCID": "TST-03",
      "Test Title": "Hai yêu cầu xóa bài thi cùng lúc xử lý an toàn",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.deleteTest() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "TST-05a",
      "Test Title": "Mất kết nối DB khi lấy danh sách câu hỏi ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getQuestions() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "TST-05b",
      "Test Title": "Lỗi Rollback transaction khi lưu câu hỏi và đáp án ném lỗi",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.addQuestion() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockCreateQuestionInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "TST-IT-01",
      "Test Title": "GET /api/admin/tests trả về danh sách bài thi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/tests?ceftLevel=B1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: ceftLevel=B1",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TST-IT-02",
      "Test Title": "POST /api/admin/tests tạo bài thi mới hợp lệ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/tests.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockCreateTestInput",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TST-IT-03",
      "Test Title": "GET /api/admin/tests/:testId/questions lấy câu hỏi bài thi",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/tests/1/questions.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của test",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TST-IT-04",
      "Test Title": "DELETE /api/admin/tests/:testId xóa bài thi thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/tests/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của test",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TST-IT-05",
      "Test Title": "POST /api/admin/tests thiếu title trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/tests.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ lessonId: 10 }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "TST-IT-06",
      "Test Title": "POST /api/admin/tests/upload-media không gửi file trả về 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/tests/upload-media.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của test",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "TST-IT-07",
      "Test Title": "Mất kết nối database khi gọi danh sách trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/tests.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của test",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "topic": [
    {
      "TCID": "TOP-01a",
      "Test Title": "Lấy danh sách toàn bộ chủ đề",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getAllTopics() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Dữ liệu mock chuẩn của module topic",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TOP-01b",
      "Test Title": "Tạo chủ đề mới thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.createTopic() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: mockCreateTopicInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TOP-01c",
      "Test Title": "Xóa chủ đề thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.deleteTopic() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "TOP-02",
      "Test Title": "Tìm/sửa/xóa chủ đề không tồn tại ném lỗi 404",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.getTopicById() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 9999",
      "Result Expect": "Ném ngoại lệ ApiError với status 404, mã lỗi 'ApiError'."
    },
    {
      "TCID": "TOP-03",
      "Test Title": "Nhiều request sửa topic đồng thời",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.updateTopic() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { title: 'T1' }",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "TOP-05",
      "Test Title": "Mất kết nối DB khi xóa topic ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.deleteTopic() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "TOP-IT-01",
      "Test Title": "GET /api/admin/topics trả về danh sách chủ đề",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/topics.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của topic",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TOP-IT-02",
      "Test Title": "POST /api/admin/topics tạo chủ đề mới",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/topics.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ title: 'Chủ đề 2' }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TOP-IT-03",
      "Test Title": "DELETE /api/admin/topics/:id xóa chủ đề",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP DELETE tới endpoint /api/admin/topics/1.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của topic",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "TOP-IT-04",
      "Test Title": "POST /api/admin/topics thiếu title trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/topics.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ description: 'Thiếu title' }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "TOP-IT-05",
      "Test Title": "Mất kết nối DB khi lấy danh sách trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/topics.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của topic",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "word": [
    {
      "TCID": "WRD-01a",
      "Test Title": "Lấy danh sách từ vựng có phân trang và bộ lọc",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của word.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong word.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "WRD-01b",
      "Test Title": "Thêm từ vựng mới thành công",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của word.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong word.mock.ts",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "WRD-02",
      "Test Title": "Trùng từ và loại từ (headword + partOfSpeech) ném lỗi 400 word_exists",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của word.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong word.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'word_exists'."
    },
    {
      "TCID": "WRD-03",
      "Test Title": "Nhiều Admin cập nhật từ vựng song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của word.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong word.mock.ts",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "WRD-05",
      "Test Title": "Mất kết nối DB khi xóa từ ném lỗi hệ thống",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của word.\n3. Kiểm tra giá trị trả về hoặc bắt exception.",
      "Data": "Dữ liệu test fixture trong word.mock.ts",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "WRD-IT-01",
      "Test Title": "GET /api/admin/word trả về danh sách từ vựng",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/word.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của word",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "WRD-IT-02",
      "Test Title": "POST /api/admin/word tạo từ vựng mới",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/word.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ headword: 'test', partOfSpeech: 'noun' }",
      "Result Expect": "HTTP Status: 201. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "WRD-IT-03",
      "Test Title": "POST /api/admin/word trùng từ vựng trả về 400 word_exists",
      "Test Summary": "Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/admin/word.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ headword: 'duplicate', partOfSpeech: 'noun' }",
      "Result Expect": "HTTP Status: 400. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "WRD-IT-04",
      "Test Title": "Mất kết nối DB khi lấy danh sách từ trả về 500",
      "Test Summary": "Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/admin/word.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Path param hoặc Payload chuẩn của word",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ],
  "word-matching": [
    {
      "TCID": "WM-01a",
      "Test Title": "Khởi tạo bàn chơi chia thành 2 cột A & B",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4, lessonId: 1 }",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "WM-01b",
      "Test Title": "Nộp bài và chấm điểm chính xác (2 đúng, 1 sai)",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitAnswers() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockSubmitWordMatchingInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "WM-01c",
      "Test Title": "Lưu tiến trình nối từ tạm thời",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.saveProgress() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockSaveWordMatchingProgressInput",
      "Result Expect": "Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số."
    },
    {
      "TCID": "WM-02a",
      "Test Title": "Bắt đầu ván chơi khi thiếu từ vựng (< 4 từ) ném lỗi 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "WM-02b",
      "Test Title": "Bắt đầu ván chơi khi DB không có từ nào ném 400",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.startGame() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, { limit: 4 }",
      "Result Expect": "Ném ngoại lệ ApiError với status 400, mã lỗi 'not_enough_words'."
    },
    {
      "TCID": "WM-03",
      "Test Title": "Hai yêu cầu nộp bài submit song song",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitAnswers() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockSubmitWordMatchingInput",
      "Result Expect": "Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie."
    },
    {
      "TCID": "WM-05",
      "Test Title": "Mất kết nối database khi nộp bài ném lỗi",
      "Test Summary": "Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)",
      "Step": "1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.submitAnswers() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.",
      "Data": "Args: 1, mockSubmitWordMatchingInput",
      "Result Expect": "Ném ngoại lệ ApiError với status 4xx, mã lỗi 'ApiError'."
    },
    {
      "TCID": "WM-IT-01",
      "Test Title": "GET /api/word-matching/start khởi tạo bàn chơi nối từ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/word-matching/start?limit=4.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=4",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "WM-IT-02",
      "Test Title": "POST /api/word-matching/submit nộp bài nối từ",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/word-matching/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockSubmitWordMatchingInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "WM-IT-03",
      "Test Title": "POST /api/word-matching/progress lưu tiến trình tạm",
      "Test Summary": "Kiểm thử chức năng chuẩn (Happy Path)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/word-matching/progress.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockSaveWordMatchingProgressInput",
      "Result Expect": "HTTP Status: 200. Response trả về success = true cùng dữ liệu hợp lệ."
    },
    {
      "TCID": "WM-IT-04",
      "Test Title": "POST /api/word-matching/submit answers rỗng trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP POST tới endpoint /api/word-matching/submit.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "{ duration: 10, answers: [] }",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "WM-IT-05",
      "Test Title": "GET /api/word-matching/start limit < 4 trả về 422",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/word-matching/start?limit=2.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "Query parameters: limit=2",
      "Result Expect": "HTTP Status: 422. Báo lỗi validation hoặc bad request rõ ràng, không làm crash server."
    },
    {
      "TCID": "WM-IT-06",
      "Test Title": "Lỗi database khi nộp bài trả về 500",
      "Test Summary": "Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)",
      "Step": "1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP GET tới endpoint /api/....\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.",
      "Data": "mockSubmitWordMatchingInput",
      "Result Expect": "HTTP Status: 500. Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn."
    }
  ]
};
  
  const headers = ["TCID", "Test Title", "Test Summary", "Step", "Data", "Result Expect"];
  
  for (const sheetName in data) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clear();
    }
    
    // Header styling
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, 6);
    headerRange.setFontWeight("bold")
               .setBackground("#1F4E78")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
               
    const rows = data[sheetName].map(item => [
      item["TCID"],
      item["Test Title"],
      item["Test Summary"],
      item["Step"],
      item["Data"],
      item["Result Expect"]
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 6).setValues(rows).setWrap(true);
    }
    
    // Auto resize
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 320);
    sheet.setColumnWidth(3, 260);
    sheet.setColumnWidth(4, 320);
    sheet.setColumnWidth(5, 250);
    sheet.setColumnWidth(6, 320);
  }
  
  SpreadsheetApp.getUi().alert("Hoàn thành! Đã tạo và cập nhật " + Object.keys(data).length + " sheets với đầy đủ test cases.");
}
