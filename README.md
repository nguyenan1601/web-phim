# Web Phim

Website xem phim được xây bằng Next.js App Router, lấy dữ liệu phim từ API `ophim1.com` và dùng Supabase để lưu tài khoản, hồ sơ, phim yêu thích và lịch sử xem.

## Chạy nhanh với Docker (không cần cài Node.js)

```bash
git clone https://github.com/nguyenan1601/web-phim.git
cd web-phim/frontend
cp .env.example .env          # Sửa URL và publishable key Supabase của bạn trong .env
docker compose up app -d      # App chạy tại http://localhost:3000
```

Yêu cầu duy nhất: **Docker** (có kèm Docker Compose).

## Cài đặt thủ công (không dùng Docker)

Yêu cầu: Node.js 20+, npm.

```bash
npm install
cp .env.example .env.local    # Điền Supabase URL và key
npm run dev                   # Dev server tại http://localhost:3000
npm run build                 # Build production
npm run start                 # Chạy bản production
npm run lint                  # Kiểm tra ESLint
```

Ứng dụng vẫn đọc được danh sách phim từ API công khai khi thiếu Supabase, nhưng tính năng đăng nhập, yêu thích, lịch sử xem sẽ không hoạt động.

## Tính năng chính

- Trang chủ hiển thị phim mới cập nhật, mục tiếp tục xem và các danh sách phim theo ngữ cảnh.
- Trang chi tiết phim với thông tin, poster, mô tả, danh sách tập và phim liên quan.
- Trang xem phim hỗ trợ nguồn HLS `.m3u8`, chọn tập và ghi nhớ tiến độ xem.
- Tìm kiếm phim bằng API gốc kết hợp bộ tìm kiếm cục bộ/fuzzy.
- Lọc phim theo danh sách, thể loại, quốc gia, năm phát hành và bộ lọc nâng cao.
- Đăng nhập/đăng ký qua Supabase Auth.
- Lưu phim yêu thích và đồng bộ lịch sử xem giữa localStorage và Supabase.
- SEO cơ bản với metadata, sitemap và robots.

## Công nghệ

- Next.js `16`
- React `19`
- TypeScript
- Tailwind CSS `4`
- Supabase SSR/Auth
- HLS.js, React Player
- Framer Motion
- Zustand
- Sonner
- Lucide React

## Cấu trúc thư mục

```text
frontend
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── src/app             # Route, layout, server actions, API routes
├── src/components      # Component UI theo domain
├── src/lib             # Hàm gọi API, tìm kiếm, local history
├── src/utils/supabase  # Supabase client/server/middleware
├── public              # Asset tĩnh
└── package.json
```

## Supabase Schema

Code đọc/ghi các bảng sau (cần tạo thủ công trên Supabase dashboard nếu chưa có migration):

| Bảng | Cột chính | Ghi chú |
|------|-----------|---------|
| `profiles` | `id`, `full_name`, `avatar_url`, `updated_at` | Hồ sơ người dùng |
| `favorites` | `id`, `user_id`, `movie_slug`, `movie_name`, `movie_thumb`, `created_at` | Phim yêu thích |
| `watch_history` | `user_id`, `movie_slug`, `movie_name`, `movie_thumb`, `episode_slug`, `episode_name`, `progress_seconds`, `total_seconds`, `updated_at` | Tiến độ xem |

`watch_history` upsert theo cặp `user_id,movie_slug` — cần unique constraint tương ứng.

## API phim

Nguồn dữ liệu chính: `https://ophim1.com/v1/api`

| Endpoint | Mô tả |
|----------|-------|
| `/home?page={page}` | Trang chủ |
| `/danh-sach/{slug}?page={page}` | Danh sách phim |
| `/the-loai/{slug}?page={page}` | Phim theo thể loại |
| `/quoc-gia/{slug}?page={page}` | Phim theo quốc gia |
| `/nam-phat-hanh/{year}?page={page}` | Phim theo năm |
| `/phim/{slug}` | Chi tiết phim |
| `/tim-kiem?keyword={keyword}` | Tìm kiếm |

## Routes

- `/` — Trang chủ
- `/phim/[slug]` — Chi tiết phim
- `/xem/[slug]` — Xem phim
- `/tim-kiem` — Tìm kiếm
- `/loc` — Bộ lọc nâng cao
- `/danh-sach/[slug]` — Danh sách phim
- `/the-loai/[slug]` — Thể loại
- `/quoc-gia/[slug]` — Quốc gia
- `/nam/[slug]` — Năm phát hành
- `/login`, `/register` — Xác thực
- `/profile` — Hồ sơ
- `/yeu-thich` — Yêu thích
- `/lich-su` — Lịch sử xem

## Ghi chú

- Hình ảnh remote từ OPhim CDN cấu hình trong `next.config.ts`.
- Route `/api/proxy-stream` proxy playlist/segment HLS để giảm lỗi CORS.
- Dữ liệu phim phụ thuộc API bên thứ ba — có thể chậm hoặc đổi schema.
- Tìm kiếm nâng cao cache bộ phim trong memory của server runtime (không bền vững).