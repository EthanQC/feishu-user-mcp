# feishu-user-plugin — Claude Code Instructions

## What This Is
All-in-one Feishu plugin for Claude Code with three auth layers:
- **User Identity** (cookie auth): Send messages (text, image, file, post, sticker, audio) as yourself
- **Official API** (app credentials): Read group messages, docs, tables, wiki, drive, contacts
- **User OAuth UAT** (user_access_token): Read P2P chat history, list all user's chats

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
- `get_user_info` — User display name lookup
- `get_login_status` — Check cookie, app, and UAT status

### User OAuth UAT Tools (P2P chat reading)
- `read_p2p_messages` — Read P2P (direct message) chat history. Requires OAuth setup.
- `list_user_chats` — List group chats the user is in. Note: API only returns groups, not P2P. For P2P, use: `search_contacts` → `create_p2p_chat` → `read_p2p_messages`.

### Official API Tools (app credentials)
- `list_chats` / `read_messages` — Chat history (read_messages accepts chat name, auto-resolves to oc_ ID)
- `reply_message` / `forward_message` — Message operations (as bot)
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
- Reply as bot → `reply_message` (official API)
- Diagnose issues → `get_login_status` first

## Auth & Session
- **LARK_COOKIE**: Required for user identity tools. Session auto-refreshed every 4h via heartbeat.
- **LARK_APP_ID + LARK_APP_SECRET**: Required for official API tools.
- **LARK_USER_ACCESS_TOKEN**: Required for P2P reading. Obtained via OAuth flow. Auto-refreshed.
- Cookie expiry: sl_session has 12h max-age, auto-refreshed by heartbeat.

## P2P Chat Reading Setup
To enable `read_p2p_messages` and `list_user_chats`, the Feishu app needs:
1. App type: custom app (自建应用), NOT marketplace/b2c/b2b
2. Scopes: `im:message`, `im:message:readonly`, `im:chat:readonly`
3. OAuth redirect URI: `http://127.0.0.1:9997/callback`
4. The app must NOT have "对外共享" (external sharing) enabled
5. Run `node src/oauth.js` to authorize and save the UAT

## Troubleshooting Guide (IMPORTANT — read this when things go wrong)

### If MCP tools are not available
The most likely cause is a `.mcp.json` configuration error. Check:
1. **The config must NOT have `"type": "stdio"`** — Claude Code's `.mcp.json` does not use a `type` field for stdio servers.
2. The correct Claude Code config format:
```json
{
  "feishu-user-plugin": {
    "command": "npx",
    "args": ["-y", "feishu-user-plugin"],
    "env": {
      "LARK_COOKIE": "...",
      "LARK_APP_ID": "cli_xxxx",
      "LARK_APP_SECRET": "xxxx"
    }
  }
}
```
3. After fixing, the user must restart the Claude Code session.

### If cookie authentication fails
- `document.cookie` in browser console **CANNOT** access HttpOnly cookies (`session`, `sl_session`), which are essential.
- The Application → Cookies tab shows individual entries but has no "copy all as string" feature.
- **Correct method**: Network tab → Disable cache → reload → click first request → Request Headers → Cookie → right-click → Copy value.
- **Best method**: If Playwright MCP is available, use `context.cookies('https://www.feishu.cn')` to get all cookies including HttpOnly, then format as `name=value; name=value; ...` string.

### If OAuth fails with error 20029 (redirect_uri invalid)
- The Feishu app must have `http://127.0.0.1:9997/callback` registered as a redirect URI in Security Settings.

### If list_user_chats doesn't return P2P chats
- This is expected — the Feishu `GET /im/v1/chats` API only returns group chats, not P2P.
- **Correct P2P flow**: `search_contacts` (find user) → `create_p2p_chat` (get chat_id) → `read_p2p_messages` (read history).
- The Feishu app must NOT have "对外共享" (external sharing) enabled for any chat listing to work.

## Automated Cookie Setup via Playwright (IMPORTANT)

When LARK_COOKIE is missing or expired, Claude Code should **automatically** obtain it using Playwright MCP.
Do NOT ask the user to manually copy cookies from DevTools. The full flow:

### Prerequisites
Playwright MCP must be available. If not installed, tell the user:
> To enable automatic cookie setup, add Playwright MCP to your config. Run:
> `npx @anthropic-ai/claude-code mcp add playwright -- npx @anthropic-ai/mcp-server-playwright`
> Then restart Claude Code.

### Automated Flow (when Playwright MCP is available)
1. Use `browser_navigate` to open `https://www.feishu.cn/messenger/`
2. Use `browser_take_screenshot` to show the QR code to the user
3. Tell the user: "Please scan the QR code with Feishu mobile app to log in"
4. Poll with `browser_snapshot` every 3-5 seconds until the page changes (messenger loads)
5. Once logged in, run via `browser_evaluate`:
   ```js
   // Get all cookies including HttpOnly ones
   const cookies = await window.__playwright_cookies || null;
   ```
   This won't work since evaluate runs in page context. Instead use `browser_run_code`:
   ```js
   const cookies = await context.cookies('https://www.feishu.cn');
   const cookieStr = cookies.map(c => c.name + '=' + c.value).join('; ');
   ```
6. Read the user's `.mcp.json` (project-level or `~/.claude.json`), update the `LARK_COOKIE` value
7. Tell the user to restart Claude Code session for the new cookie to take effect

### Cookie Refresh
When a tool returns "Session expired" or cookie auth fails:
1. Inform the user the cookie has expired
2. Offer to re-run the Playwright flow above
3. Cookie heartbeat auto-refreshes every 4h, so cookies typically last 12h+ during active sessions

## Known Limitations
- Image/file upload must go through Official API or feishu-file-bridge first to obtain keys
- CARD message type (type=14) not yet implemented — complex JSON schema
