# feishu-user-mcp — Claude Code Instructions

## What This Is
MCP Server that lets Claude Code send Feishu messages as the user's personal identity (not a bot), using reverse-engineered Protobuf protocol.

## Available MCP Tools
- `send_as_user` — Send message to a chat by chat_id
- `search_contacts` — Search users/groups by name keyword
- `create_p2p_chat` — Create P2P chat with a user, returns chat_id
- `send_to_user` — One-step: search user → create chat → send message
- `get_chat_info` — Get group chat details (name, description, member count)
- `get_user_info` — Get user display name by user_id
- `get_login_status` — Check if cookie session is valid

## Usage Patterns
- To send a message to someone: use `send_to_user` with their name
- To send to a group: first `search_contacts` to find the group chat_id, then `send_as_user`
- Always check `get_login_status` first if operations start failing

## Cookie Session
- Cookie expires periodically (typically 12-24 hours)
- When expired, user needs to re-login at feishu.cn and update LARK_COOKIE in .env
- Signs of expiry: init fails, send returns errors, status shows no user ID
