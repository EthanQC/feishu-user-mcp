以你本人的飞书身份发送消息（非机器人）。

## 参数
- $ARGUMENTS：收件人和消息内容，格式："收件人: 消息内容"

## 执行步骤
1. 解析 $ARGUMENTS，以第一个冒号分离收件人和消息内容
2. 判断收件人类型：
   - 如果是人名 → 使用 `send_to_user`（自动搜索用户 → 创建单聊 → 发送）
   - 如果是群名 → 使用 `send_to_group`（自动搜索群 → 发送）
   - 如果是 chat_id（纯数字）→ 使用 `send_as_user`
3. 发送前向用户确认收件人和消息内容
4. 发送并返回结果

## 富文本消息
如果消息包含格式化需求（加粗、链接、@人），改用 `send_post_as_user`：
```
send_post_as_user({
  chat_id: "xxx",
  title: "标题（可选）",
  paragraphs: [[{tag:"text",text:"普通文本"}, {tag:"text",text:"加粗",style:["bold"]}]]
})
```

## 注意
- 消息以你的**个人飞书身份**发送，不是机器人
- 支持发送给个人（单聊）和群组
- 如需回复某条消息的话题，用 `send_as_user` 并传 `root_id`
