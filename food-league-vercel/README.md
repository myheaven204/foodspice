# Food League T5

Dashboard public đọc dữ liệu Google Sheet và hiển thị leaderboard ăn uống tháng 5.

## Chạy local

```bash
npm install
npm run dev
```

Mở: http://localhost:3000

## Deploy Vercel

1. Tạo repo GitHub mới.
2. Push toàn bộ thư mục này lên GitHub.
3. Vào https://vercel.com/new và import repo.
4. Deploy.

## Cách hoạt động

- Frontend: `public/index.html`
- API proxy: `api/sheet.js`
- API đọc Google Sheet CSV, phân tích dữ liệu, trả JSON cho dashboard.
- Nút Refresh gọi `/api/sheet?refresh=1` để lấy dữ liệu mới nhất.
- Dashboard tự refresh mỗi 1 tiếng khi trang đang mở.

## Yêu cầu

Google Sheet cần để quyền `Anyone with the link can view` để Vercel API đọc được CSV.
