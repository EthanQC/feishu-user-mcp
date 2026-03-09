检查飞书所有认证层的登录状态。

## 执行步骤

1. 使用 `get_login_status` 检查三层认证状态：
   - **Cookie 会话**：是否有效，当前登录用户
   - **App 凭证**：LARK_APP_ID / LARK_APP_SECRET 是否配置
   - **User Access Token**：UAT 是否可用（P2P 单聊读取需要）

2. 根据结果给出建议：
   - Cookie 过期 → 提示用 Playwright 自动获取新 Cookie
   - App 凭证缺失 → 提示配置 .mcp.json
   - UAT 缺失 → 提示运行 `npx feishu-user-plugin oauth`

## Cookie 自动获取（Playwright）
如果 Cookie 过期且 Playwright MCP 可用：
1. `browser_navigate` → `https://www.feishu.cn/messenger/`
2. `browser_take_screenshot` → 展示二维码让用户扫码
3. 轮询 `browser_snapshot` 直到登录成功
4. `browser_run_code`: `const cookies = await context.cookies('https://www.feishu.cn'); cookies.filter(c => c.domain.endsWith('feishu.cn')).map(c => c.name + '=' + c.value).join('; ')`
5. 更新 `.mcp.json` 中的 LARK_COOKIE
6. 提示重启 Claude Code
