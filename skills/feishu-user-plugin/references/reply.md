读取飞书聊天的最近消息并回复。

## 参数
- $ARGUMENTS：群名关键词或 chat_id，可选指定消息数量（默认 10 条）

## 执行步骤

### 群聊消息
1. 用 `read_messages` 读取消息（直接传群名，会自动搜索解析为 oc_ ID）
2. 向用户展示最近 N 条消息摘要（标注发送人和时间）
3. 用户指定要回复哪条消息后，用 `reply_message` 回复（以机器人身份）
4. 如需以个人身份回复，用 `send_as_user` 并传 `root_id`（话题回复）

### 单聊消息（P2P）
1. 用 `search_contacts` 搜索对方用户名
2. 用 `create_p2p_chat` 获取单聊 chat_id（数字格式）
3. 用 `read_p2p_messages` 读取历史消息（需要 OAuth UAT）
4. 如需回复，用 `send_as_user` 发送

## 注意
- 群聊读取用 `read_messages`（Official API，机器人需在群内）
- 单聊读取用 `read_p2p_messages`（User OAuth，需要 UAT 授权）
- `reply_message` 只能回复**文本类型**消息，其他类型会返回 230054 错误
