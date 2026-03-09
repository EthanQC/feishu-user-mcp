# feishu-user-plugin 开发计划

## v1.1 — 待验证功能补全

以下功能代码已实现，但因需要外部资源或特定环境尚未实测。

### 需要文件上传支持的消息类型
- [ ] `send_image_as_user` — 需要先上传图片获取 `image_key`，再调用发送
- [ ] `send_file_as_user` — 需要先上传文件获取 `file_key`，再调用发送
- [ ] `send_sticker_as_user` — 需要 `sticker_id` + `sticker_set_id`
- [ ] `send_audio_as_user` — 需要先上传音频获取 `audio_key`

**解决方案**：实现图片/文件上传工具（`upload_image`、`upload_file`），支持从本地路径或 URL 上传，返回 key 后自动发送。或集成 feishu-file-bridge。

### 需要真实多维表格的 Bitable 操作
- [ ] `list_bitable_tables` — 列出表格
- [ ] `list_bitable_fields` — 列出字段
- [ ] `search_bitable_records` — 查询记录
- [ ] `create_bitable_record` — 创建记录
- [ ] `update_bitable_record` — 更新记录

**解决方案**：创建一个测试用多维表格，写入 app_token 到测试脚本中做端到端验证。

### 有副作用跳过的操作
- [ ] `forward_message` — 转发消息（跳过原因：会产生实际通知）
- [ ] `create_folder` — 创建云盘文件夹（跳过原因：会产生真实文件夹）

**解决方案**：在测试群/测试文件夹中验证后清理。

## v1.2 — 多账号灵活切换

### 需求
当前 MCP server 启动时绑定一组凭证（LARK_COOKIE + APP_ID/SECRET + UAT），无法在运行时切换用户身份。多人协作或管理多个飞书账号时需要灵活切换。

### 方案设计

#### 方案 A：配置文件多 Profile
```json
// .env.profiles 或 .feishu-profiles.json
{
  "default": {
    "LARK_COOKIE": "...",
    "LARK_APP_ID": "cli_xxx",
    "LARK_APP_SECRET": "xxx"
  },
  "work": {
    "LARK_COOKIE": "...",
    "LARK_APP_ID": "cli_yyy",
    "LARK_APP_SECRET": "yyy"
  }
}
```
- 新增 MCP 工具 `switch_profile` — 运行时切换凭证 profile
- 新增 MCP 工具 `list_profiles` — 列出可用 profile
- Client 和 Official 实例重新初始化

#### 方案 B：MCP 多实例
在 `.mcp.json` 中注册多个 server 实例，每个绑定不同凭证：
```json
{
  "feishu-personal": { "command": "npx", "args": ["-y", "feishu-user-plugin"], "env": { "LARK_COOKIE": "..." } },
  "feishu-work": { "command": "npx", "args": ["-y", "feishu-user-plugin"], "env": { "LARK_COOKIE": "..." } }
}
```
- 优点：无需代码改动，Claude Code 原生支持
- 缺点：每个实例独立进程，资源开销大

#### 推荐
方案 A 更灵活且资源友好，但方案 B 零代码改动可立即使用。建议先文档化方案 B 作为即时方案，v1.2 实现方案 A 作为正式功能。

### 实现清单
- [ ] 设计 profile 配置文件格式
- [ ] 实现 `switch_profile` / `list_profiles` 工具
- [ ] Client 和 Official 实例热重载
- [ ] Cookie 和 UAT 按 profile 独立管理
- [ ] 文档：多账号配置指南

## v1.3 — 其他规划
- [ ] CARD 消息类型 (type=14) 支持 — 需要逆向 card JSON schema
- [ ] 图片/文件上传工具 — 本地文件 → image_key/file_key 一步到位
- [ ] 消息搜索 — 按关键词搜索聊天历史
- [ ] 批量消息发送 — 群发给多个用户/群
