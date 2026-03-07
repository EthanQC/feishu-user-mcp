# feishu-user-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)

[English](README.md) | **中文**

**以你的个人身份发飞书消息 — 不是机器人。**

一个 MCP（Model Context Protocol）服务器，通过逆向飞书 Web 端的 Protobuf 协议，让 Claude Code 和其他 AI 工具能以你的真实身份发消息、搜索联系人、管理会话。

## 为什么需要这个？

飞书官方 API 有一个硬限制：**没有 `send_as_user` 权限**。即使使用 `user_access_token`（OAuth），消息仍然显示 `sender_type: "app"` — 来自应用而不是你。

本项目完全绕过了这个限制，使用飞书 Web 客户端内部使用的同一协议。

```
官方 API:  你 → 机器人应用 → 飞书（显示为机器人发送）
本项目:    你 → Cookie 认证 → 飞书（显示为你本人发送）
```

## 功能

| 工具 | 说明 |
|------|------|
| `send_to_user` | 搜索用户 + 发消息 — 一步到位 |
| `send_to_group` | 搜索群组 + 发消息 — 一步到位 |
| `send_as_user` | 通过 chat ID 发消息到任意会话 |
| `search_contacts` | 搜索用户、机器人和群组 |
| `create_p2p_chat` | 创建/获取单聊会话 |
| `get_chat_info` | 获取群详情（群名、人数、群主等） |
| `get_user_info` | 查询用户显示名称 |
| `get_login_status` | 检查会话是否有效 |

## 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/EthanQC/feishu-user-mcp.git
cd feishu-user-mcp
npm install
```

### 2. 获取 Cookie

登录 [feishu.cn/messenger](https://www.feishu.cn/messenger/)，然后提取 Cookie。

> **重要**：需要 HttpOnly 的 Cookie（如 `session`），`document.cookie` 无法获取。请使用以下方法：

**方法一：浏览器 DevTools（手动）**
1. 打开 `F12` → `应用` → `Cookie` → `https://www.feishu.cn`
2. 全选所有 Cookie，右键复制
3. 格式化为 `name1=value1; name2=value2; ...` 字符串

**方法二：Playwright（推荐，可获取 HttpOnly Cookie）**
```js
// 如果你在 Claude Code 中配置了 Playwright MCP：
const cookies = await context.cookies('https://www.feishu.cn');
const cookieStr = cookies.map(c => c.name + '=' + c.value).join('; ');
```

### 3. 配置

```bash
cp .env.example .env
# 编辑 .env，在 LARK_COOKIE= 后面粘贴你的 Cookie 字符串
```

### 4. 验证

```bash
node src/test-send.js              # 检查登录状态
node src/test-send.js search 张三   # 搜索联系人
```

### 5. 接入 AI 客户端

<details>
<summary><strong>Claude Code</strong></summary>

在你的项目 `.mcp.json` 中添加：

```json
{
  "mcpServers": {
    "feishu-user-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/你的绝对路径/feishu-user-mcp/src/index.js"],
      "env": {}
    }
  }
}
```

然后直接说："给张三发消息说明天下午开会"

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

添加到 `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）：

```json
{
  "mcpServers": {
    "feishu-user-mcp": {
      "command": "node",
      "args": ["/你的绝对路径/feishu-user-mcp/src/index.js"]
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor / VS Code / Windsurf</strong></summary>

配置格式类似，具体路径参见 [English README](README.md#client-setup)。

</details>

## Claude Code 技能

仓库包含即用的 Claude Code 技能（`.claude/commands/`）：

| 技能 | 用法 | 说明 |
|------|------|------|
| `/send` | `/send 张三: 明天下午3点开会` | 给用户发消息 |
| `/search` | `/search 技术` | 搜索联系人和群组 |
| `/status` | `/status` | 检查登录状态 |

## 工作原理

```
┌──────────────┐     Cookie 认证     ┌──────────────────────────────────────┐
│  Claude Code │ ───────────────────→ │  internal-api-lark-api.feishu.cn     │
│  (MCP 客户端) │ ←───────────────── │  /im/gateway/ (Protobuf over HTTP)   │
└──────────────┘     Protobuf        └──────────────────────────────────────┘
```

**协议命令**（Protobuf `cmd` 字段）：
| cmd | 操作 | Proto 消息 |
|-----|------|-----------|
| 5 | 发送消息 | `PutMessageRequest` |
| 13 | 创建会话 | `PutChatRequest` |
| 64 | 获取群信息 | `GetGroupInfoRequest` |
| 5023 | 获取用户信息 | `GetUserInfoRequest` |
| 11021 | 搜索 | `UniversalSearchRequest` |

基于 [cv-cat/LarkAgentX](https://github.com/cv-cat/LarkAgentX)（Python）的协议研究，用 Node.js 完全重写并集成 MCP。

## Cookie 生命周期

- 飞书 Web 会话通常持续 **12-24 小时**
- 会话过期后，MCP 服务器会抛出认证错误
- 需要重新登录 feishu.cn 并更新 `.env` 中的 `LARK_COOKIE`
- 使用 `get_login_status` 工具检查会话状态

## 局限性

- Cookie 认证需要定期手动刷新
- 依赖飞书内部协议 — 飞书更新 Web 客户端可能导致失效
- 仅支持文本消息（暂不支持富文本、图片、卡片）
- 暂无实时消息接收（WebSocket 监听尚未实现）
- 可能违反飞书服务条款 — 使用风险自负

## 致谢

- [cv-cat/LarkAgentX](https://github.com/cv-cat/LarkAgentX) — 飞书协议逆向工程（Python）
- [cv-cat/OpenFeiShuApis](https://github.com/cv-cat/OpenFeiShuApis) — 底层 API 研究
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP 标准

## 许可证

[MIT](LICENSE)
