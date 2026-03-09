管理飞书云盘文件和文件夹。

## 参数
- $ARGUMENTS：操作类型 + 文件夹标识

## 执行步骤

### 列出文件
1. 用 `list_files` 列出文件夹内容
   - 不传 folder_token 则列出根目录
   - 传入 folder_token 则列出指定文件夹

### 创建文件夹
1. 用 `create_folder` 创建新文件夹
   - 传入 name 和可选的 parent_token

## 示例
- `/drive list` — 列出根目录文件
- `/drive list folderXxx` — 列出指定文件夹
- `/drive create 项目资料` — 在根目录创建文件夹

## 注意
- 使用 Official API，需要 LARK_APP_ID
- 文件列表受机器人权限范围限制
