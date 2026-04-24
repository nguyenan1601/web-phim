# Frontend

Đây là ứng dụng Next.js App Router cho dự án Web Phim.

Tài liệu chính nằm ở [`../README.md`](../README.md). File này chỉ giữ các lệnh nhanh khi làm việc trực tiếp trong thư mục `frontend`.

## Cài đặt

```bash
npm install
```

Tạo `.env.local` nếu dùng Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Lệnh

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Dev server mặc định chạy tại `http://localhost:3000`.

## Ghi chú

- Source chính nằm trong `src/app`, `src/components`, `src/lib` và `src/utils/supabase`.
- API phim gốc: `https://phim.nguonc.com/api`.
- Route `/api/proxy-stream` xử lý proxy HLS cho video `.m3u8`.
