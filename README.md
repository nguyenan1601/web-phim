# Web Phim — Frontend

Xem README gốc tại [../README.md](../README.md) để biết tổng quan dự án.

## Chạy nhanh với Docker

```bash
cp .env.example .env          # Điền Supabase URL và key
docker compose up app -d      # http://localhost:3000
```

Yêu cầu: Docker.

## Chạy thủ công

```bash
npm install
cp .env.example .env.local    # Điền Supabase URL và key
npm run dev                   # http://localhost:3000
```

Yêu cầu: Node.js 20+, npm.