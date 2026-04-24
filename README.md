# Web Phim

Website xem phim được xây bằng Next.js App Router, lấy dữ liệu phim từ API `phim.nguonc.com` và dùng Supabase để lưu tài khoản, hồ sơ, phim yêu thích và lịch sử xem.

## Tính năng chính

- Trang chủ hiển thị phim mới cập nhật, mục tiếp tục xem và các danh sách phim theo ngữ cảnh.
- Trang chi tiết phim với thông tin phim, poster, mô tả, danh sách tập và phim liên quan.
- Trang xem phim hỗ trợ nguồn HLS `.m3u8`, chọn tập và ghi nhớ tiến độ xem.
- Tìm kiếm phim bằng API gốc kết hợp bộ tìm kiếm cục bộ/fuzzy để tăng khả năng khớp kết quả.
- Lọc phim theo danh sách, thể loại, quốc gia, năm phát hành và bộ lọc nâng cao.
- Đăng nhập/đăng ký qua Supabase Auth.
- Lưu phim yêu thích và đồng bộ lịch sử xem giữa localStorage và Supabase khi người dùng đăng nhập.
- SEO cơ bản với metadata, sitemap và robots.

## Công nghệ

- Next.js `16.2.3`
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- Supabase SSR/Auth
- HLS.js, React Player
- Framer Motion
- Zustand
- Sonner
- Lucide React

## Cấu trúc dự án

```text
.
├── api.md                  # Ghi chú API phim đang sử dụng
├── PLAN-movie-web.md       # Kế hoạch/ý tưởng ban đầu
└── frontend
    ├── src/app             # Route, layout, server actions, API routes
    ├── src/components      # Component UI theo domain
    ├── src/lib             # Hàm gọi API, tìm kiếm, local history
    ├── src/utils/supabase  # Supabase client/server/middleware
    ├── public              # Asset tĩnh
    └── package.json
```

## Yêu cầu

- Node.js 20 trở lên
- npm
- Một Supabase project nếu muốn dùng đăng nhập, yêu thích và lịch sử xem

Ứng dụng vẫn có thể đọc danh sách phim từ API công khai, nhưng các tính năng cần tài khoản sẽ không hoạt động đúng nếu thiếu Supabase.

## Cài đặt

```bash
cd frontend
npm install
```

Tạo file `.env.local` trong thư mục `frontend`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Chạy môi trường phát triển:

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Lệnh thường dùng

```bash
npm run dev      # Chạy dev server
npm run build    # Build production
npm run start    # Chạy bản production sau khi build
npm run lint     # Kiểm tra ESLint
```

## Supabase

Code hiện tại đọc/ghi các bảng sau:

- `profiles`: lưu hồ sơ người dùng, gồm tối thiểu `id`, `full_name`, `avatar_url`, `updated_at`.
- `favorites`: lưu phim yêu thích, gồm `id`, `user_id`, `movie_slug`, `movie_name`, `movie_thumb`, `created_at`.
- `watch_history`: lưu tiến độ xem, gồm `user_id`, `movie_slug`, `movie_name`, `movie_thumb`, `episode_slug`, `episode_name`, `progress_seconds`, `total_seconds`, `updated_at`.

`watch_history` đang upsert theo cặp `user_id,movie_slug`, vì vậy database cần có unique constraint tương ứng. Repository hiện chưa có migration SQL chính thức, nên khi dựng môi trường mới cần tạo schema Supabase thủ công hoặc bổ sung migration.

## API phim

Nguồn dữ liệu chính là:

```text
https://phim.nguonc.com/api
```

Các nhóm endpoint đang dùng:

- `/films/phim-moi-cap-nhat?page={page}`
- `/films/danh-sach/{slug}?page={page}`
- `/films/the-loai/{slug}?page={page}`
- `/films/quoc-gia/{slug}?page={page}`
- `/films/nam-phat-hanh/{year}?page={page}`
- `/film/{slug}`
- `/films/search?keyword={keyword}`

Xem thêm ghi chú trong `api.md`.

## Route chính

- `/`: trang chủ
- `/phim/[slug]`: chi tiết phim
- `/xem/[slug]`: xem phim
- `/tim-kiem`: kết quả tìm kiếm
- `/loc`: bộ lọc nâng cao
- `/danh-sach/[slug]`: danh sách phim theo nhóm
- `/the-loai/[slug]`: phim theo thể loại
- `/quoc-gia/[slug]`: phim theo quốc gia
- `/nam/[slug]`: phim theo năm
- `/login`, `/register`: xác thực
- `/profile`: hồ sơ người dùng
- `/yeu-thich`: phim yêu thích
- `/lich-su`: lịch sử xem

## Ghi chú bảo trì

- Hình ảnh remote từ `phim.nguonc.com` đang được cấu hình trong `frontend/next.config.ts`.
- Route `/api/proxy-stream` proxy playlist/segment HLS để giảm lỗi CORS khi phát video.
- Một số file tài liệu cũ có dấu tiếng Việt bị lỗi encoding; README này dùng UTF-8.
- Dữ liệu phim phụ thuộc API bên thứ ba, nên cần xử lý trường hợp API chậm, đổi schema hoặc trả về thiếu trường.
- Chức năng tìm kiếm nâng cao có cache bộ phim cục bộ trong memory của server runtime, không phải cache bền vững.

## Kiểm tra trước khi bàn giao

```bash
cd frontend
npm run lint
npm run build
```

Sau khi chạy app, nên kiểm tra thủ công các luồng: tìm kiếm phim, mở trang chi tiết, phát một tập, đăng nhập, thêm yêu thích, cập nhật lịch sử xem và đồng bộ lịch sử sau khi đăng nhập.
