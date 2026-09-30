# EndfieldFrontend

独立的终末地控制台前端。它只请求 `EndfieldBackend` 的 `/api/*` 接口，不读取或调用速通审判庭面板。

## 本地运行

```powershell
pnpm install
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:2100/api'
pnpm dev
```

默认地址：`http://localhost:3001`。

