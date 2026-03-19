---
description: Deploy website lên Azdigi cPanel hosting (nguyenvanhao.name.vn)
---

# Deploy lên Azdigi Hosting

Deploy code từ local lên hosting Azdigi thông qua GitHub → cPanel Git Version Control.

## Yêu cầu trước khi chạy lần đầu

Cần setup **cPanel Git Version Control** 1 lần duy nhất (xem hướng dẫn bên dưới).

## Các bước deploy

// turbo-all

1. Kiểm tra trạng thái git hiện tại
```bash
git status
```

2. Add tất cả thay đổi
```bash
git add -A
```

3. Tạo commit với message mô tả thay đổi. Thay `<message>` bằng nội dung phù hợp, ví dụ: "Fix UI toolkit lightmode"
```bash
git commit -m "<message>"
```

4. Push lên GitHub (sẽ trigger cPanel auto-pull nếu đã setup)
```bash
git push origin main
```

5. (Tùy chọn) Nếu cPanel chưa setup auto-pull, cần trigger deploy thủ công bằng cPanel API:
```bash
# Thay YOUR_CPANEL_TOKEN bằng API token từ cPanel > Manage API Tokens
curl -s -H "Authorization: cpanel qskqmzfd:YOUR_CPANEL_TOKEN" "https://hfn52pro-22290.azdigihost.com:2083/execute/VersionControl/update?repository_root=/home/qskqmzfd/repositories/hao-blog&branch=main"
```

6. Kiểm tra website đã cập nhật
```
Mở trình duyệt: https://nguyenvanhao.name.vn/
```

---

## Hướng dẫn setup cPanel Git (chỉ làm 1 lần)

1. Đăng nhập cPanel: https://hfn52pro-22290.azdigihost.com:2083
2. Tìm **Git™ Version Control** (mục Files hoặc Software)
3. Click **Create** → bật **Clone a Repository**
4. Điền:
   - **Clone URL**: `https://github.com/vanhao1997/hao-blog.git`
   - **Repository Path**: `/home/qskqmzfd/repositories/hao-blog`
   - **Repository Name**: `hao-blog`
5. Click **Create**
6. Sau khi clone xong → click **Manage** → **Pull or Deploy** → **Deploy HEAD Commit**
7. Kiểm tra website đã hiển thị đúng

Từ lần sau chỉ cần chạy `/deploy` trong Antigravity!
