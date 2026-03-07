#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { LarkUserClient } = require('./client');

let client = null;

async function getClient() {
  if (client) return client;
  const cookie = process.env.LARK_COOKIE;
  if (!cookie) throw new Error('LARK_COOKIE not set. See README for setup instructions.');
  client = new LarkUserClient(cookie);
  await client.init();
  return client;
}

const TOOLS = [
  {
    name: 'send_as_user',
    description: 'Send a message as the logged-in Feishu user (not a bot). Messages appear from your personal account. Supports P2P and group chats.',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'Target chat ID (numeric string). Get this from search_contacts or create_p2p_chat.' },
        text: { type: 'string', description: 'Message text to send' },
      },
      required: ['chat_id', 'text'],
    },
  },
  {
    name: 'send_to_user',
    description: 'Search a user by name, create P2P chat, and send message — all in one step. The easiest way to message someone.',
    inputSchema: {
      type: 'object',
      properties: {
        user_name: { type: 'string', description: 'Recipient name to search for (Chinese or English)' },
        text: { type: 'string', description: 'Message text to send' },
      },
      required: ['user_name', 'text'],
    },
  },
  {
    name: 'send_to_group',
    description: 'Search a group chat by name and send a message to it — all in one step.',
    inputSchema: {
      type: 'object',
      properties: {
        group_name: { type: 'string', description: 'Group chat name to search for' },
        text: { type: 'string', description: 'Message text to send' },
      },
      required: ['group_name', 'text'],
    },
  },
  {
    name: 'search_contacts',
    description: 'Search for Feishu users, bots, or group chats by name. Returns IDs and names for use with other tools.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword (name or partial name)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_p2p_chat',
    description: 'Create or get an existing P2P (direct message) chat with a user. Returns the chat ID.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'Target user ID (numeric string from search_contacts)' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_chat_info',
    description: 'Get detailed information about a chat (group name, description, member count, owner, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'Chat ID to get info for' },
      },
      required: ['chat_id'],
    },
  },
  {
    name: 'get_user_info',
    description: 'Get a user\'s display name by their user ID.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID to look up' },
        chat_id: { type: 'string', description: 'Chat ID for context (optional, helps resolve names in group chats)' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_login_status',
    description: 'Check if the Feishu cookie session is still valid. Use this to diagnose authentication issues.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const server = new Server(
  { name: 'feishu-user-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const c = await getClient();

    switch (name) {
      case 'send_as_user': {
        const result = await c.sendMessage(args.chat_id, args.text);
        return {
          content: [{ type: 'text', text: result.success
            ? `Message sent as user to chat ${args.chat_id}`
            : `Send failed: status=${result.status}` }],
        };
      }

      case 'send_to_user': {
        const results = await c.search(args.user_name);
        const user = results.find((r) => r.type === 'user');
        if (!user) {
          return { content: [{ type: 'text', text: `User "${args.user_name}" not found. Search results: ${JSON.stringify(results)}` }] };
        }
        const chatId = await c.createChat(user.id);
        if (!chatId) {
          return { content: [{ type: 'text', text: `Failed to create chat with ${user.title} (${user.id})` }] };
        }
        const result = await c.sendMessage(chatId, args.text);
        return {
          content: [{ type: 'text', text: result.success
            ? `Message sent to ${user.title} (chat: ${chatId})`
            : `Send failed: status=${result.status}` }],
        };
      }

      case 'send_to_group': {
        const results = await c.search(args.group_name);
        const group = results.find((r) => r.type === 'group');
        if (!group) {
          return { content: [{ type: 'text', text: `Group "${args.group_name}" not found. Search results: ${JSON.stringify(results)}` }] };
        }
        const result = await c.sendMessage(group.id, args.text);
        return {
          content: [{ type: 'text', text: result.success
            ? `Message sent to group "${group.title}" (chat: ${group.id})`
            : `Send failed: status=${result.status}` }],
        };
      }

      case 'search_contacts': {
        const results = await c.search(args.query);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      }

      case 'create_p2p_chat': {
        const chatId = await c.createChat(args.user_id);
        return {
          content: [{ type: 'text', text: chatId
            ? `P2P chat created/found: ${chatId}`
            : 'Failed to create P2P chat' }],
        };
      }

      case 'get_chat_info': {
        const info = await c.getGroupInfo(args.chat_id);
        return {
          content: [{ type: 'text', text: info
            ? JSON.stringify(info, null, 2)
            : `Could not get info for chat ${args.chat_id}` }],
        };
      }

      case 'get_user_info': {
        const name = await c.getUserName(args.user_id, args.chat_id || '0');
        return {
          content: [{ type: 'text', text: name
            ? `User ${args.user_id}: ${name}`
            : `Could not resolve name for user ${args.user_id}` }],
        };
      }

      case 'get_login_status': {
        return {
          content: [{ type: 'text', text: c.userId
            ? `Session active. User: ${c.userName || c.userId} (ID: ${c.userId})`
            : 'Session expired. Re-login at feishu.cn and update LARK_COOKIE.' }],
        };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[feishu-user-mcp] MCP Server started on stdio');
}

main().catch(console.error);
