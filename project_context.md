# Project Context — Hao Blog
> Auto-updated bởi team workflows. KHÔNG xóa file này.

## 🎯 Vision
- **Sản phẩm**: Hao Blog
- **Mô tả**: Blog cá nhân chuyên nghiệp của Nguyễn Văn Hảo chia sẻ kiến thức Digital Marketing & AI
- **Target users**: Người làm Marketing, AI Enthusiasts, Độc giả học hỏi Marketing
- **Status**: Live / Refactoring

## 🎨 Brand
- **Primary color**: Mint Green (#22C55E)
- **Font**: DM Sans & Space Grotesk
- **Tone**: Professional, Expert, Friendly
- **Logo**: Text Icon 'H'

## 🏗️ Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (Clean Architecture Modularized)
- **Backend**: Native PHP (API-based, JWT/Session Hybrid)
- **Database**: MySQL/MariaDB (PDO)
- **Hosting**: Azdigi cPanel Hosting

## 📋 Current Sprint
- [x] Security Hardening (OWASP Top 10 Basic) → /security
- [x] Clean Architecture Decomposition → /architect
- [x] Blog Viewer UX Enhancement → /fe
- [x] Admin Dashboard Editor Fullpage Upgrade → /fe

## 📝 Key Decisions
- [2026-04-17]: Thay vì đập bỏ dùng React/NextJS mất SEO, đã quyết định giữ nguyên PHP + Vanilla HTML nhưng Build lại cấu trúc Module/Component (Clean Architecture). Code vừa chạy nhanh, không thay đổi đường link ảnh hưởng SEO, vừa cực kỳ dễ maintain.
- [2026-04-17]: Deploy qua CPanel phải quản lý Database mapping thủ công và sửa `DB_HOST=127.0.0.1` nếu local socket bị chặn.

## ⚠️ Constraints & Rules
- Không đẩy `api/.env` lên server, phải cấu hình tay để bảo mật dữ liệu.
- Mọi logic chung về string, UI đều phải tham chiếu tới `js/core/utils.js` và `js/core/components.js`.

## 📂 Docs Index
- Changelog: `CHANGELOG.md`
