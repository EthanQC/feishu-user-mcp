搜索飞书联系人或群组。

## 参数
- $ARGUMENTS: 搜索关键词

## 执行步骤
1. 使用 `search_contacts` 搜索 $ARGUMENTS
2. 将结果按类型分组展示：
   - 用户（user）：显示名称和 ID
   - 群组（group）：显示群名和 ID
   - 机器人（bot）：显示名称和 ID
3. 提示用户可用的后续操作：
   - `/send 用户名: 消息` 发送消息
   - `/reply 群名` 读取群聊并回复
   - `/digest 群名` 整理聊天摘要

## 通过邮箱或手机号查找
如果用户提供了邮箱或手机号，改用 `find_user`：
```
find_user({ email: "xxx@xxx.com" })
find_user({ mobile: "+86xxx" })
```
