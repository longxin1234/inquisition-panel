# Endfield Control

终末地控制台前端，提供用户端、代理端和管理端工作台。

## 开发

```bash
pnpm install
pnpm dev
```

默认访问 `http://localhost:3000`。

## 环境变量

| 变量名 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 后端 API 地址 |

示例：

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:12000
```

生产环境请在部署平台的环境变量配置中填写实际后端地址，不要把密钥或私有配置提交到仓库。

## 维护者

`loqwe`

## 许可证

Apache-2.0
