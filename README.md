# feishu-user-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)

**English** | [中文](README_CN.md)

**Send Feishu messages as YOUR personal identity — not a bot.**

An MCP (Model Context Protocol) server that reverse-engineers Feishu's internal Protobuf protocol, enabling Claude Code and other AI tools to send messages, search contacts, and manage chats as the real you.

## Why This Exists

Feishu's official API has a hard limitation: **there is no `send_as_user` scope**. Even with `user_access_token` (OAuth), messages still show `sender_type: "app"` — they come from your app, not from you.

This project bypasses that limitation entirely by using the same protocol that Feishu's web client uses internally.

```
Official API:  You → Bot App → Feishu (shows as bot)
This project:  You → Cookie Auth → Feishu (shows as YOU)
```

## Tools

| Tool | Description |
|------|-------------|
| `send_to_user` | Search user by name + send message — one step |
| `send_to_group` | Search group by name + send message — one step |
| `send_as_user` | Send message to any chat by ID |
| `search_contacts` | Search users, bots, and groups |
| `create_p2p_chat` | Create/get a direct message chat |
| `get_chat_info` | Get group details (name, members, owner) |
| `get_user_info` | Look up a user's display name |
| `get_login_status` | Check if your session is still valid |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/EthanQC/feishu-user-mcp.git
cd feishu-user-mcp
npm install
```

### 2. Get Your Cookie

Login to [feishu.cn/messenger](https://www.feishu.cn/messenger/) in your browser, then extract cookies.

> **Important**: You need HttpOnly cookies (like `session`), which `document.cookie` cannot access. Use one of these methods:

**Option A: Browser DevTools (Manual)**
1. Open `F12` → `Application` → `Cookies` → `https://www.feishu.cn`
2. Select all cookies, right-click → Copy
3. Format as `name1=value1; name2=value2; ...` string

**Option B: Playwright (Recommended)**
```js
// If you have Playwright MCP configured in Claude Code:
const cookies = await context.cookies('https://www.feishu.cn');
const cookieStr = cookies.map(c => c.name + '=' + c.value).join('; ');
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env and paste your cookie string after LARK_COOKIE=
```

### 4. Verify

```bash
node src/test-send.js              # Check login status
node src/test-send.js search 张三   # Search contacts
```

### 5. Connect to Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "feishu-user-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/feishu-user-mcp/src/index.js"],
      "env": {}
    }
  }
}
```

Then in Claude Code, you can say:
- "给张三发消息说明天下午开会"
- "搜索一下飞书里有哪些群"
- "检查一下飞书登录状态"

## Claude Code Skills

This repo includes ready-to-use Claude Code skills in `.claude/commands/`:

| Skill | Usage | Description |
|-------|-------|-------------|
| `/send` | `/send 张三: 明天下午3点开会` | Send message to a user |
| `/search` | `/search 技术` | Search contacts and groups |
| `/status` | `/status` | Check login status |

## How It Works

```
┌──────────────┐     Cookie Auth     ┌──────────────────────────────────────┐
│  Claude Code │ ───────────────────→ │  internal-api-lark-api.feishu.cn     │
│  (MCP Client)│ ←───────────────── │  /im/gateway/ (Protobuf over HTTP)   │
└──────────────┘     Protobuf        └──────────────────────────────────────┘
```

**Protocol**: HTTP POST with `application/x-protobuf` content type to Feishu's internal gateway.

**Commands** (Protobuf `cmd` field):
| cmd | Operation | Proto Message |
|-----|-----------|---------------|
| 5 | Send message | `PutMessageRequest` |
| 13 | Create chat | `PutChatRequest` |
| 64 | Get chat info | `GetGroupInfoRequest` |
| 5023 | Get user info | `GetUserInfoRequest` |
| 11021 | Search | `UniversalSearchRequest` |

**Auth flow**:
1. POST to `/accounts/csrf` → get `swp_csrf_token` from Set-Cookie
2. GET `/accounts/web/user` with CSRF token → get user ID
3. Use cookie + CSRF for all subsequent Protobuf requests

Based on protocol research from [cv-cat/LarkAgentX](https://github.com/cv-cat/LarkAgentX) (Python), completely rewritten in Node.js with MCP integration.

## Cookie Lifecycle

- Feishu web sessions typically last **12-24 hours**
- When your session expires, the MCP server will throw an auth error
- Re-login at feishu.cn and update `LARK_COOKIE` in `.env`
- Use `get_login_status` tool to check session health

## Limitations

- Cookie-based auth requires periodic manual refresh
- Depends on Feishu's internal protocol — may break if Feishu changes their web client
- Text messages only (no rich text, images, or cards yet)
- No real-time message receiving (WebSocket listener not yet implemented)
- May violate Feishu's Terms of Service — use at your own risk

## Project Structure

```
feishu-user-mcp/
├── src/
│   ├── index.js        # MCP server entry point (8 tools)
│   ├── client.js       # LarkUserClient — Protobuf gateway client
│   ├── utils.js        # ID generators, cookie parser, MD5
│   └── test-send.js    # CLI test tool
├── proto/
│   └── lark.proto      # Feishu Protobuf message definitions
├── .claude/
│   └── commands/       # Claude Code skills (send, search, status)
├── CLAUDE.md           # Claude Code project instructions
├── .env.example        # Cookie configuration template
└── package.json
```

## Contributing

Issues and PRs welcome. If Feishu updates their protocol, please open an issue with the error details.

## License

[MIT](LICENSE)

## Acknowledgments

- [cv-cat/LarkAgentX](https://github.com/cv-cat/LarkAgentX) — Original Feishu protocol reverse-engineering (Python)
- [cv-cat/OpenFeiShuApis](https://github.com/cv-cat/OpenFeiShuApis) — Underlying API research
- [Model Context Protocol](https://modelcontextprotocol.io) — The MCP standard
