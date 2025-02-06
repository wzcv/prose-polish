import { PromptCardManager } from './js/promptCard.js';
import { MarkdownHandler } from './js/markdownHandler.js';
import { ConnectionManager } from './js/connectionManager.js';
import { CONFIG } from './config.js';
import { initializeCardManagement } from './js/promptCard.js';

// 更新配置
const API_CONFIG = {
    TONGYI_API_KEY: CONFIG.TONGYI_API_KEY,
    API_URL: 'http://localhost:3000/api/chat',  // 更新为本地服务器地址
};

// DOM 元素
const promptCards = document.querySelectorAll('.prompt-card');
const submitButton = document.getElementById('submit-prompt');
const promptOutput = document.getElementById('prompt-output');
const cardContainer = document.querySelector('.prompt-cards');
const paragraphContainer = document.getElementById('paragraph-cards');

// 初始化管理器
const cardManager = new PromptCardManager(cardContainer);
const markdownHandler = new MarkdownHandler(paragraphContainer);
const connectionManager = new ConnectionManager();

// 将管理器暴露到全局，供其他模块使用
window.cardManager = cardManager;
window.connectionManager = connectionManager;

// 监听窗口大小变化和滚动，更新连接线
window.addEventListener('resize', () => connectionManager.updateConnections());
window.addEventListener('scroll', () => connectionManager.updateConnections());

// 设置拖拽功能
// 拖拽开始时记录内容
promptOutput.addEventListener('dragstart', (e) => {
    const content = promptOutput.textContent.trim();
    if (content && content !== '等待提交提示词...' && content !== 'AI思考中...') {
        e.dataTransfer.setData('text/plain', content);
        // 添加拖拽效果
        promptOutput.style.opacity = '0.5';
    } else {
        e.preventDefault();
    }
});

// 拖拽结束时恢复样式
promptOutput.addEventListener('dragend', () => {
    promptOutput.style.opacity = '1';
});

// 允许放置
paragraphContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

// 处理放置事件
paragraphContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const content = e.dataTransfer.getData('text/plain');
    if (content) {
        // 计算放置位置
        const rect = paragraphContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 创建新卡片
        const card = markdownHandler.createCard(content);
        card.style.left = `${x - 150}px`; // 卡片宽度的一半
        card.style.top = `${y - 75}px`;  // 卡片高度的一半
    }
});

// 添加默认卡片
async function addDefaultCards() {
    // 添加第一个卡片
    const card1 = cardManager.addCard(
        '规范表述',
        '你是一位专业的文字编辑。这是一段文字，但它的表述不是很符合现代汉语规范。请你修改它的表述，使其能够满足现代汉语规范的需求：{{text}}'
    );
    console.log('Added card 1:', card1.id);

    // 等待一毫秒以确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 1));

    // 添加第二个卡片
    const card2 = cardManager.addCard(
        '衔接',
        '你是一位专业的文字编辑。以下有两段文字，我想把它们衔接在一起，但直接衔接太突兀了。请你编写第三段文字，可以插在两段文字之间，让表达顺畅：\n\n```{{p1}}```\n\n```{{p2}}```'
    );
    console.log('Added card 2:', card2.id);

    await new Promise(resolve => setTimeout(resolve, 1));

    // 添加第三个卡片
    const card3 = cardManager.addCard(
        '稿件整体化',
        '你是一位专业的文字编辑。这是一段文字，但写得太细碎了。请你改写这段文字，使其整体性强一些，要求情感真挚、用词标准：{{text}}'
    );
    console.log('Added card 3:', card3.id);
}

// 添加默认文本卡片
function addDefaultTextCard() {
    const defaultText = `欢迎使用AI写作助手！这是一个示例文本卡片。试试导入《端午的鸭蛋》，或者点击右下角的 + 添加新卡片开始写作吧！`;

    const card = markdownHandler.createCard(defaultText);
    card.style.left = '10px';
    card.style.top = '10px';
}

// 在页面加载完成后添加默认卡片
document.addEventListener('DOMContentLoaded', () => {
    addDefaultCards();  // 添加默认提示词卡片
    addDefaultTextCard();  // 添加默认文本卡片
});

// 监听卡片选择
cardManager.onCardSelected = (card) => {
    submitButton.disabled = !card;
    if (card) {
        document.querySelectorAll('.prompt-card').forEach(element => {
            element.classList.remove('selected');
            if (element.id === card.id) {
                element.classList.add('selected');
            }
        });
    }
};

// 添加新卡片按钮
document.getElementById('add-card').addEventListener('click', () => {
    cardManager.showEditDialog(null);
});

// 修改提示词提交处理
submitButton.addEventListener('click', async () => {
    const selectedCard = cardManager.selectedCard;
    if (!selectedCard) return;

    try {
        // 获取替换了占位符的提示词
        const prompt = selectedCard.getPromptWithConnections();
        console.log(prompt);

        promptOutput.textContent = 'AI思考中...';
        submitButton.disabled = true;

        const response = await callAIAPI(prompt, 'tongyi');
        promptOutput.textContent = response;
    } catch (error) {
        promptOutput.textContent = `错误：${error.message}`;
    } finally {
        submitButton.disabled = false;
    }
});

// 初始化 Markdown 处理器
markdownHandler.init();

// 创建隐藏的文件输入框
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.md';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// 处理文件导入
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await markdownHandler.handleFileImport(file);
        // 重置文件输入框的值，这样可以重复导入相同的文件
        fileInput.value = '';
    }
});

// 触发文件选择
document.getElementById('import-button').addEventListener('click', () => {
    fileInput.click();
});

// 导出Markdown文件
document.getElementById('export-button').addEventListener('click', () => {
    const cards = Array.from(document.querySelectorAll('.paragraph-card'));
    
    // 按y坐标排序，y相同时按x坐标排序
    cards.sort((a, b) => {
        const aY = parseInt(a.style.top);
        const bY = parseInt(b.style.top);
        if (aY === bY) {
            const aX = parseInt(a.style.left);
            const bX = parseInt(b.style.left);
            return aX - bX;
        }
        return aY - bY;
    });

    // 提取文本内容并用双换行符连接
    const content = cards
        .map(card => card.querySelector('.card-content').textContent.trim())
        .filter(text => text) // 过滤掉空文本
        .join('\n\n');

    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/markdown' });
    
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'exported_document.md';
    
    // 触发下载
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // 清理URL对象
    URL.revokeObjectURL(downloadLink.href);
});

// 添加删除所有段落的功能
document.getElementById('clear-paragraphs').addEventListener('click', () => {
    if (confirm('确定要删除所有段落卡片吗？此操作不可撤销。')) {
        // 清空所有段落卡片
        paragraphContainer.innerHTML = '';
        
        // 清除所有相关的连接
        if (window.connectionManager) {
            window.connectionManager.clearAllConnections();
        }

        // 重置导入计数器
        markdownHandler.importCount = 0;
    }
});

// 模拟API调用（后续需要替换为真实的API调用）
async function mockApiCall(message, model) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `这是来自 ${model} 的回复：我收到了你的消息："${message}"`;
}

// 修改 callAIAPI 函数
async function callAIAPI(message, model) {
    if (model === 'tongyi') {
        try {
            const response = await fetch(API_CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': API_CONFIG.TONGYI_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen-turbo',
                    input: {
                        messages: [
                            {
                                role: 'system',
                                content: '你是通义千问助手，一个强大的AI助手。请用简洁友好的方式回答问题。'
                            },
                            {
                                role: 'user',
                                content: message
                            }
                        ]
                    },
                    parameters: {
                        result_format: 'message'
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API调用失败: ${errorData.message || '未知错误'}`);
            }

            const data = await response.json();
            return data.output?.choices?.[0]?.message.content;
        } catch (error) {
            throw error;
        }
    }
    
    return mockApiCall(message, model);
}

document.addEventListener('DOMContentLoaded', () => {
    // 初始化卡片管理功能
    initializeCardManagement();
    
    // ... existing initialization code ...
}); 