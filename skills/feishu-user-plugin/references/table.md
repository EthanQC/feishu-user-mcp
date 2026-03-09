操作飞书多维表格（Bitable）。

## 参数
- $ARGUMENTS：操作类型 + 表格标识

## 执行步骤

### 查询数据
1. 用 `list_bitable_tables` 获取表格列表（传入 app_token）
2. 用 `list_bitable_fields` 获取字段结构（传入 app_token + table_id）
3. 用 `search_bitable_records` 查询记录（支持 filter 和 sort）
4. 格式化展示查询结果

### 写入数据
1. 先用 `list_bitable_fields` 确认字段结构
2. 用 `create_bitable_record` 创建新记录
   ```
   create_bitable_record({ app_token, table_id, fields: {"状态":"进行中","标题":"新任务"} })
   ```

### 更新数据
1. 先用 `search_bitable_records` 定位目标记录的 record_id
2. 用 `update_bitable_record` 更新指定字段

## 示例
- `/table query appXxx` — 列出所有表格
- `/table query appXxx tblXxx` — 查询表格记录
- `/table create appXxx tblXxx {"状态":"进行中"}` — 创建记录

## 注意
- 需要知道 app_token（从多维表格 URL 中获取）
- 字段名必须与表格中的字段名完全匹配
