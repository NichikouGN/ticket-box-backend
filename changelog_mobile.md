# Lịch sử thay đổi tích hợp Mobile Redirect Bridge Server

Tài liệu này ghi nhận toàn bộ các chỉnh sửa cấu hình môi trường và dịch vụ điều hướng (Bridge Server) trên nhánh `feat/mobile-bridge-server` để hỗ trợ luồng thanh toán Deep Link của Mobile App trên Android Emulator.

---

## 1. Thiết lập tệp cấu hình môi trường (.env)
* **Thực hiện**: Sao chép toàn bộ các tệp `.env` mẫu từ thư mục backup `v0.8.1` sang các thư mục dịch vụ tương ứng ở repo `ticket-box-backend` để đảm bảo có thể chạy dev bình thường.
* **Thay đổi**: Cập nhật giá trị `FRONTEND_URL` ở tệp `.env` của `payment-service` (`services/payment-service/.env`) trỏ về địa chỉ IP mạng ảo định tuyến của Android Emulator:
  ```env
  # Mobile bridge server - Android Emulator dùng 10.0.2.2 thay localhost
  FRONTEND_URL='http://10.0.2.2:5173'
  ```

---

## 2. Tạo máy chủ Bridge Server mới
* **Đường dẫn**: `services/bridge/index.js`
* **Công nghệ**: Node.js thuần (sử dụng thư viện `http` và `url` tích hợp sẵn), không cài đặt thêm package nào khác.
* **Mục đích**: Chạy ở cổng `5173` để đóng vai trò làm Web Frontend trung gian xử lý các điều hướng của Stripe Checkout chuyển hướng về Mobile App thông qua Custom URL Scheme.
* **Các Endpoint hỗ trợ**:
  * `GET /payment-success?orderId=xxx`: Trả về giao diện HTML/CSS, tự động chạy JS để kích hoạt: `ticketboxmobileapp://payment-success?orderId=xxx`. Có kèm nút bấm dự phòng nếu thiết bị không tự redirect.
  * `GET /payment-cancelled`: Trả về giao diện thông báo hủy giao dịch, tự động redirect về App Mobile: `ticketboxmobileapp://payment-cancelled`.

---

## 3. Tích hợp lệnh khởi chạy vào package.json
* **Đường dẫn**: `package.json`
* **Thay đổi**:
  * Thêm lệnh khởi chạy riêng cho Bridge Server:
    ```json
    "dev:bridge": "node services/bridge/index.js"
    ```
  * Tích hợp lệnh này vào cuối danh sách lệnh `dev` chạy song song bằng `concurrently`:
    ```json
    "dev": "concurrently \"npm:dev:gateway\" \"npm:dev:user\" \"npm:dev:concert\" \"npm:dev:order\" \"npm:dev:payment\" \"npm:dev:ticket\" \"npm:dev:notification\" \"npm:dev:bridge\""
    ```
  * Giữ nguyên hoàn toàn các script khác (bao gồm cả `dev:stripe`).
