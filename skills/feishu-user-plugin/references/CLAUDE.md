# feishu-user-plugin — Claude Code Instructions

## What This Is
All-in-one Feishu plugin for Claude Code with three auth layers:
- **User Identity** (cookie auth): Send messages (text, image, file, post, sticker, audio) as yourself
- **Official API** (app credentials): Read group messages, docs, tables, wiki, drive, contacts
- **User OAuth UAT** (user_access_token): Read P2P chat history

## Tool Categories

### User Identity — Messaging (reverse-engineered, cookie-based)
- `send_to_user` — Search user + send text (one step, most common)
- `send_to_group` — Search group + send text (one step)
- `send_as_user` — Send text to any chat by ID, supports reply threading (root_id/parent_id)
- `send_image_as_user` — Send image (requires image_key from upload)
- `send_file_as_user` — Send file (requires file_key from upload)
- `send_post_as_user` — Send rich text with title + formatted paragraphs
- `send_sticker_as_user` — Send sticker/emoji
- `send_audio_as_user` — Send audio message

### User Identity — Contacts & Info
- `search_contacts` — Search users/groups by name
- `create_p2p_chat` — Create/get P2P chat
- `get_chat_info` — Group details (name, members, owner)
- `get_user_info` — User display name lookup (from search cache)
- `get_login_status` — Check cookie, app, and UAT status

### User OAuth UAT Tools (P2P chat reading)
- `read_p2p_messages` — Read P2P (direct message) chat history. Requires OAuth setup.
- `list_user_chats` — List group chats the user is in. Note: API only returns groups, not P2P. For P2P, use: `search_contacts` → `create_p2p_chat` → `read_p2p_messages`.

### Official API Tools (app credentials)
- `list_chats` / `read_messages` — Chat history (read_messages accepts chat name, auto-resolves to oc_ ID)
- `reply_message` / `forward_message` — Message operations (as bot). reply_message only works for text messages.
- `search_docs` / `read_doc` / `create_doc` — Document operations
- `list_bitable_tables` / `list_bitable_fields` / `search_bitable_records` — Table queries
- `create_bitable_record` / `update_bitable_record` — Table writes
- `list_wiki_spaces` / `search_wiki` / `list_wiki_nodes` — Wiki
- `list_files` / `create_folder` — Drive
- `find_user` — Contact lookup by email/mobile

## Usage Patterns
- Send text as yourself → `send_to_user` or `send_to_group`
- Send rich content → `send_post_as_user` (formatted text), `send_image_as_user` (images)
- Read group chat history → `read_messages` with chat name or oc_ ID
- Read P2P chat history → `search_contacts` → `create_p2p_chat` → `read_p2p_messages` (requires OAuth UAT)
- Reply as user in thread → `send_as_user` with root_id
- Reply as bot → `reply_message` (official API, text messages only)
- Diagnose issues → `get_login_status` first

## Auth & Session
- **LARK_COOKIE**: Required for user identity tools. Session auto-refreshed every 4h via heartbeat.
- **LARK_APP_ID + LARK_APP_SECRET**: Required for official API tools.
- **LARK_USER_ACCESS_TOKEN**: Required for P2P reading. Obtained via OAuth flow. Auto-refreshed via refresh_token.

## Automated Cookie Setup via Playwright

When LARK_COOKIE is missing or expired, automatically obtain it using Playwright MCP.
Do NOT ask the user to manually copy cookies from DevTools.

### Prerequisites
Playwright MCP must be available. If not, tell the user:
> Run: `npx @anthropic-ai/claude-code mcp add playwright -- npx @anthropic-ai/mcp-server-playwright`
> Then restart Claude Code.

### Automated Flow
1. `browser_navigate` → `https://www.feishu.cn/messenger/`
2. `browser_take_screenshot` → show QR code to user, ask them to scan with Feishu app
3. Poll `browser_snapshot` every 3-5s until messenger page loads
4. `browser_run_code`:
   ```js
   const cookies = await context.cookies('https://www.feishu.cn');
   const feishuCookies = cookies.filter(c => c.domain.endsWith('feishu.cn'));
   const cookieStr = feishuCookies.map(c => c.name + '=' + c.value).join('; ');
   ```
5. Read user's `.mcp.json`, update `LARK_COOKIE` value
6. Tell user to restart Claude Code

### Cookie Refresh
When cookie auth fails, offer to re-run the Playwright flow. Heartbeat auto-refreshes every 4h.

## Troubleshooting

### If cookie authentication fails
- **Best method**: Playwright `context.cookies()` (includes HttpOnly)
- **Manual fallback**: Network tab → Disable cache → reload → first request → Request Headers → Cookie → Copy value
- Do NOT use `document.cookie` or Application → Cookies (misses HttpOnly cookies)

### If list_user_chats doesn't return P2P chats
- This is expected — the Feishu API only returns group chats at this endpoint.
- Use the P2P flow: `search_contacts` → `create_p2p_chat` → `read_p2p_messages`.

### If reply_message fails with error 230054
- "This operation is not supported for this message type" — only text messages can be replied to.
