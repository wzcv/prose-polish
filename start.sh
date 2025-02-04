#!/bin/bash

# 设置颜色变量
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 清屏
clear

# 检查conda是否安装
if ! command -v conda &> /dev/null; then
    echo -e "${RED}错误：未检测到conda安装。${NC}"
    echo "请先安装conda后再运行此脚本。"
    exit 1
fi

# 检查并激活conda环境
CONDA_ENV="gai-chat-nodejs"
if ! conda info --envs | grep -q "$CONDA_ENV"; then
    echo -e "${BLUE}正在创建conda环境 $CONDA_ENV...${NC}"
    conda create -y -n $CONDA_ENV nodejs
    if [ $? -ne 0 ]; then
        echo -e "${RED}创建conda环境失败！${NC}"
        exit 1
    fi
fi

# 激活conda环境
echo -e "${BLUE}正在激活conda环境 $CONDA_ENV...${NC}"
eval "$(conda shell.bash hook)"
conda activate $CONDA_ENV

if [ $? -ne 0 ]; then
    echo -e "${RED}激活conda环境失败！${NC}"
    exit 1
fi

echo -e "${BLUE}=== AI写作助手启动菜单 ===${NC}\n"
echo -e "请选择启动模式："
echo -e "${GREEN}1${NC}. 完整模式 (前端 + 后端API服务)"
echo -e "${GREEN}2${NC}. 仅前端开发模式"
echo -e "${GREEN}3${NC}. 退出"

read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo -e "\n${BLUE}正在启动完整模式...${NC}"
        # 检查是否存在 config.js
        if [ ! -f "config.js" ]; then
            echo -e "\n${GREEN}提示：${NC}检测到没有 config.js 文件"
            read -p "是否要从 config.example.js 创建一个? (y/n): " create_config
            if [ "$create_config" = "y" ]; then
                cp config.example.js config.js
                echo "已创建 config.js，请记得配置你的API密钥！"
                echo "按任意键继续..."
                read -n 1
            fi
        fi
        
        # 检查依赖是否安装
        if [ ! -d "node_modules" ]; then
            echo -e "\n${GREEN}正在安装项目依赖...${NC}"
            npm install
        fi
        
        npm start
        ;;
    2)
        echo -e "\n${BLUE}正在启动前端开发模式...${NC}"
        # 检查依赖是否安装
        if [ ! -d "node_modules" ]; then
            echo -e "\n${GREEN}正在安装项目依赖...${NC}"
            npm install
        fi
        
        npm run dev
        ;;
    3)
        echo -e "\n${BLUE}再见！${NC}"
        conda deactivate
        exit 0
        ;;
    *)
        echo -e "\n${GREEN}无效的选项，请重新运行脚本。${NC}"
        conda deactivate
        exit 1
        ;;
esac 