# 使用 Node.js 官方镜像作为基础镜像
FROM node:22.14.0

# 设置工作目录
WORKDIR /app

# 将项目文件复制到容器内
COPY . .

# 安装项目依赖
RUN npm install

# 暴露端口
EXPOSE 3000

# 设置启动脚本为可执行文件
RUN chmod +x start.sh

# 定义默认的启动命令
CMD ["./docker-start.sh"]