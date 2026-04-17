# Changelog

## [2026-04-17]
### Fixed (Security Audit)
- Đưa config kết nối database vào `.env` để bảo mật
- Xóa bỏ endpoint `auth.php?action=setup` (nguy cơ tạo admin trái phép)
- Vá lỗi SQL Injection trên `api/posts.php` (chuẩn hóa tham số LIMIT)
- Chống Fixation Session bằng `session_regenerate_id()`
- Bọc lại CORS, chỉ cho phép xuất script tới `nguyenvanhao.name.vn`

### Refactored (Clean Architecture)
- Chuyển từ file 686 dòng `main.js` thành các Module riêng lẻ tại `js/features/` và `js/core/`
- Tạo template Partials cho `header.html` và `footer.html` sử dụng chung trên toàn site
- Refactor `blog.js` và `post.js` bằng cách tiêu thụ chung `Components.createPostCard()` và `Utils.formatDate()`

### Added (Blog UX Upgrade)
- Xây dựng **Admin Full-Page Editor** (`admin/editor.html`) thay thế cho form tạo cũ: Tích hợp Preview SEO, Đếm chữ, Time To Read, Import Markdown và Local Auto-Save
- Tích hợp Thanh tìm kiếm (Live Search) trên trang Blog
- Bổ sung Mục Lục tự động (TOC) và thanh Reading Progress Bar trên bài viết

---
