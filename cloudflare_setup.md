# Hướng dẫn Cài đặt Cloudflare CDN cho Thao Blog

Cloudflare giúp website tải nhanh hơn (nhờ mạng lưới phân phối CDN) và bảo mật hơn (chống DDoS, tường lửa WAF). Dưới đây là hướng dẫn chuyển tên miền `nguyenvanhao.name.vn` sang Cloudflare.

## Bước 1: Tạo tài khoản & Thêm Website
1. Truy cập [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) và tạo một tài khoản miễn phí.
2. Đăng nhập xong, nhấn nút **"Add a site"** (Thêm trang web).
3. Nhập tên miền: `nguyenvanhao.name.vn` và nhấn **"Continue"**.
4. Lăn xuống dưới cùng, chọn gói **"Free"** (Miễn phí) rồi nhấn **"Continue"**.

## Bước 2: Quét và Kiểm tra Bản ghi DNS
1. Cloudflare sẽ tự động quét tất cả các bản ghi DNS hiện đang có trên hosting gốc (Azdigi).
2. Hãy kiểm tra lại xem các bản ghi (đặc biệt là bản ghi A trỏ về IP gốc của VPS/Hosting) đã đúng chưa. Thường Cloudflare sẽ quét chính xác 100%.
3. Nhấn **"Continue"**.

## Bước 3: Đổi Nameservers (DNS) tại nơi mua Tên miền
Cloudflare sẽ cung cấp cho Sếp 2 Nameservers (ví dụ: `alan.ns.cloudflare.com` và `beth.ns.cloudflare.com`), yêu cầu Sếp phải đổi Nameservers cũ sang 2 Nameservers này.
1. Đăng nhập vào trình quản lý nơi Sếp mua tên miền `nguyenvanhao.name.vn` (TENTEN, iNet, Nhân Hòa, GoDaddy...).
2. Tìm đến mục **Quản lý Nameserver (DNS Server)** của tên miền này.
3. Chỉnh sửa và thay thế tất cả các Nameserver cũ thành 2 Nameserver mà Cloudflare đã cấp.
4. Lưu thay đổi.

> **Lưu ý:** Việc cập nhật Nameservers có thể mất từ 5 phút đến 24 giờ để đồng bộ trên toàn cầu. Tuy nhiên web vẫn hoạt động bình thường không bị gián đoạn.

## Bước 4: Hoàn thành thiết lập
1. Quay lại trang Cloudflare, nhấn nút **"Done, check nameservers"**.
2. Khi giao diện hướng dẫn tối ưu hiện lên bấm "Get Started":
   - **Automatic HTTPS Rewrites:** Bật (ON)
   - **Always Use HTTPS:** Bật (ON)
   - **Brotli:** Bật (ON)
3. Nhấn **Finish**.

## Kế hoạch tự động hoá (Tùy chọn)
Sau khi Cloudflare cài đặt thành công (trạng thái Active), tất cả hình ảnh tải lên website của Sếp sẽ được Cloudflare Proxy làm bộ nhớ đệm (Cache), tốc độ tải trang sẽ tăng cực mạnh và mượt mà hơn. Sếp sẽ không cần tải thêm plugin hay làm thêm gì ở code nữa.
