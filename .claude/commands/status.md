检查飞书登录状态。

## 执行步骤

1. 使用 `feishu-user-mcp` 的 `get_login_status` 工具检查 cookie 会话是否有效
2. 如果有效，显示当前登录的用户 ID
3. 如果已过期，提示用户需要重新获取 cookie：
   - 打开 https://www.feishu.cn/messenger/ 登录
   - 通过浏览器 DevTools 或 Playwright 提取 cookie
   - 更新 .env 文件中的 LARK_COOKIE
