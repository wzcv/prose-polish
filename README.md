# AI写作助手

**【VERY IMPORTANT】本文档大部分都由Cursor根据开发记录自动生成，仅有一小部分是人工补充，仅供参考。**

这是一个基于大语言模型的写作辅助工具，专注于提升文字编辑和内容创作的效率。目前支持通义千问作为底层语言模型。

提供了我最喜欢的课文《端午的鸭蛋》markdown版本，方便试用。

## 功能特点
- 可视化的提示词编辑系统
  - 支持创建和编辑提示词卡片
  - 提供预设的写作优化提示词模板
  - 支持提示词的变量系统，可灵活替换内容
- 文本编辑功能
  - 支持 Markdown 格式文件的导入导出
  - 支持文本块的自由拖拽排布
  - 文本块与提示词的可视化连接
- 智能写作优化
  - 支持文章段落的规范化处理
  - 支持文本衔接优化
  - 支持内容整体性优化

## 环境准备

### 系统依赖版本
项目使用conda管理环境，主要依赖版本如下：

**Conda环境依赖**
- Node.js: 20.17.0
- OpenSSL: 3.0.15
- ICU: 73.1
- LibUV: 1.48.0

**Node.js依赖**
- axios: 1.7.9
- cors: 2.8.5
- express: 4.21.2
- live-server: 1.2.2

### 环境配置步骤
1. 确保已安装 Node.js 环境（如果使用 conda）：
```bash
conda activate gai-chat-nodejs
```

2. 如果环境中没有 Node.js，请安装：
```bash
conda install nodejs
```

3. 在 [config.example.js](config.example.js) 中配置API-key，并将其重命名为config.js。API-key获取请见https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key 。

   > 我不太清楚通义、百炼、千问这些命名都有什么区别，反正是根据这个文档获取的key。

## 快速启动
项目提供了一个便捷的启动脚本 `start.sh`，可以一键完成环境配置和项目启动：

1. 首次使用前，给脚本添加执行权限：
```bash
chmod +x start.sh
```

2. 运行启动脚本：
```bash
./start.sh
```

启动脚本会自动：
- 检查并创建所需的conda环境
- 安装必要的依赖
- 提供交互式菜单让你选择启动模式：
  1. 完整模式：启动前端和后端API服务
  2. 仅前端开发模式
  3. 退出

如果你是第一次运行，脚本会：
- 自动创建并配置conda环境
- 检查是否存在config.js，如果没有会询问是否从模板创建
- 自动安装项目依赖

## 项目启动步骤
如果你不想使用启动脚本，也可以手动执行以下步骤：

1. 安装项目依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 访问应用：
- 打开浏览器
- 访问 http://localhost:3000
- ~~选择"通义千问"模型即可开始对话~~默认使用通义模型

## 常见问题
- 如果遇到依赖安装失败，可以尝试：
```bash
npm cache clean --force
npm install
```

- 如果端口 3000 被占用，可以修改 server.js 中的端口号

## 快速重启
如果需要重新启动项目：
1. 按 Ctrl+C 停止当前运行的服务
2. 运行 `npm start` 重新启动

## 开发提示
- 所有前端文件都在根目录下
- server.js 处理后端API代理
- API密钥配置在 script.js 中

### 前端开发模式
如果只需要调试前端界面，可以使用开发模式：
```bash
npm run dev
```
这将启动一个轻量级的开发服务器，支持自动刷新功能。
注意：此模式下后端API将无法使用。