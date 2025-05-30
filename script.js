import { showAlert, showConfirm } from './js/customDialogs.js';
import { PromptCardManager } from './js/promptCard.js';
import { MarkdownHandler } from './js/markdownHandler.js';
import { ConnectionManager } from './js/connectionManager.js';
import { SettingsManager } from './js/settingsManager.js';
import { SettingsDialog } from './js/settingsDialog.js';
import { ApiService } from './js/apiService.js';
import { initializeCardManagement } from './js/promptCard.js';

// 检测是否为开发模式
const isDevelopment = window.location.hostname === '127.0.0.1';

// DOM 元素
const promptCards = document.querySelectorAll('.prompt-card');
const submitButton = document.getElementById('submit-prompt');
const promptOutput = document.getElementById('prompt-output');
const cardContainer = document.querySelector('.prompt-cards');
const paragraphContainer = document.getElementById('paragraph-cards');
const settingsButton = document.getElementById('settings-button');
const importMarkdownButton = document.getElementById('import-button');
const exportMarkdownButton = document.getElementById('export-button');
const addParagraphButton = document.getElementById('add-paragraph');
const clearParagraphsButton = document.getElementById('clear-paragraphs');

// 初始化管理器
const settingsManager = new SettingsManager();
const apiService = new ApiService();
const cardManager = new PromptCardManager(cardContainer);
const markdownHandler = new MarkdownHandler(paragraphContainer);
const connectionManager = new ConnectionManager();
const settingsDialog = new SettingsDialog();

// 将管理器暴露到全局，供其他模块使用
window.cardManager = cardManager;
window.connectionManager = connectionManager;
window.settingsManager = settingsManager;
window.apiService = apiService;
window.markdownHandler = markdownHandler;

// 监听窗口大小变化和滚动，更新连接线
window.addEventListener('resize', () => connectionManager.updateConnections());
window.addEventListener('scroll', () => connectionManager.updateConnections());

// 设置拖拽功能
// 拖拽开始时记录内容
promptOutput.addEventListener('dragstart', (e) => {
    const content = promptOutput.textContent.trim();
    if (content && content !== '等待第一次提交...' && content !== 'AI思考中...') {
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
        // 计算放置位置，考虑滚动偏移
        const rect = paragraphContainer.getBoundingClientRect();
        const scrollTop = paragraphContainer.scrollTop; // 获取容器的垂直滚动位置
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top + scrollTop; // 加上滚动偏移
        
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
        '以下是一段文字，请你修改它的表述，使其能够满足现代汉语规范的需求：```{{text}}```'
    );

    // 等待一毫秒以确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 1));

    // 添加第二个卡片
    const card2 = cardManager.addCard(
        '衔接',
        '以下有两段文字，我想依次把它们衔接在一起，但直接衔接太突兀了。请你编写第三段文字，可以插在两段文字之间，让表达顺畅：\n第一段文字:<p>{{p1}}</p>。\n第二段文字:<p>{{p2}}</p>'
    );

    await new Promise(resolve => setTimeout(resolve, 1));

    // 添加第三个卡片
    const card3 = cardManager.addCard(
        '稿件整体化',
        '以下写得太细碎了。请你改写这段文字，使其整体性强一些。你不必遵循原文字的结构，可以根据它的内容，重新提炼大纲后再重写，要求情感真挚、用词标准：```{{text}}```'
    );
}

// 添加默认文本卡片
function addDefaultTextCard() {
    const defaultText = `欢迎使用AI写作助手！想要流畅地使用，你只需要记住一个规则：插头插在插座上。这是一个示例文本卡片。试试导入《端午的鸭蛋》，或者点击右下角的 + 添加新卡片开始写作吧！`;

    const card = markdownHandler.createCard(defaultText);
    card.style.left = '10px';
    card.style.top = '10px';

    // 添加第二个示例卡片
    const anotherCardText = `这是另一个示例卡片，你可以拖动、缩放、连接它们。`;
    const anotherCard = markdownHandler.createCard(anotherCardText);
    anotherCard.style.left = '10px';
    anotherCard.style.top = '170px'; // 在第一个卡片下方
}

// 在页面加载完成后添加默认卡片
document.addEventListener('DOMContentLoaded', () => {
    addDefaultCards();  // 添加默认提示词卡片
    addDefaultTextCard();  // 添加默认文本卡片
    initializeModelDropdown(); // 初始化模型下拉菜单
    initializeCardManagement(); // 确保这个在DOM加载后调用，如果它依赖DOM元素
});

// 监听设置更改事件，重新初始化模型下拉菜单
window.addEventListener('settingsChanged', () => {
    initializeModelDropdown();
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

// 设置按钮点击事件
settingsButton.addEventListener('click', () => {
    settingsDialog.show();
});

// 修改提示词提交处理
submitButton.addEventListener('click', async () => {
    const selectedCard = cardManager.selectedCard;
    if (!selectedCard) return;

    try {
        // 获取替换了占位符的提示词
        const prompt = selectedCard.getPromptWithConnections();
        const modelInfo = window.getCurrentModel();
        
        console.log('提示词:', prompt);

        promptOutput.textContent = 'AI思考中...';
        submitButton.disabled = true;

        const response = await apiService.callAI(prompt, modelInfo.model, promptOutput);
        // 不需要设置promptOutput.textContent，因为流式输出已经在apiService中处理
    } catch (error) {
        promptOutput.textContent = `错误：${error.message}`;
    } finally {
        submitButton.disabled = false;
    }
});

// 初始化模型下拉菜单
function initializeModelDropdown() {
    const modelSelector = document.getElementById('model-selector');
    const modelDropdown = document.querySelector('.model-dropdown');
    
    // 获取设置
    const settings = settingsManager.getSettings();
    
    // 清空下拉菜单
    modelDropdown.innerHTML = '';
    
    // 添加模型选项
    const modelOptions = [
        { id: 'tongyi', name: '通义千问', enabled: settings.models.tongyi.enabled },
        { id: 'deepseek-v3', name: 'DeepSeek-V3', enabled: settings.models.deepseek.enabled },
        { id: 'deepseek-r1', name: 'DeepSeek-R1', enabled: settings.models.deepseek.enabled },
        { id: 'openai', name: 'OpenAI', enabled: settings.models.openai.enabled },
        { id: 'gemini', name: 'Google Gemini', enabled: settings.models.gemini.enabled },
        { id: 'custom', name: '自定义模型', enabled: settings.models.custom.enabled }
    ];
    
    // 过滤已启用的模型
    const enabledModels = modelOptions.filter(model => model.enabled);
    
    // 如果没有启用的模型，显示设置提示
    if (enabledModels.length === 0) {
        const option = document.createElement('div');
        option.className = 'model-option';
        option.dataset.model = 'none';
        option.textContent = '请先配置模型';
        option.addEventListener('click', () => {
            settingsDialog.show();
        });
        modelDropdown.appendChild(option);
        } else {
        // 添加已启用的模型
        enabledModels.forEach(model => {
            const option = document.createElement('div');
            option.className = 'model-option';
            option.dataset.model = model.id;
            option.textContent = model.name;
            modelDropdown.appendChild(option);
        });
    }
    
    // 添加设置选项
    const settingsOption = document.createElement('div');
    settingsOption.className = 'model-option settings';
    settingsOption.dataset.model = 'settings';
    settingsOption.textContent = '设置...';
    modelDropdown.appendChild(settingsOption);
    
    // 设置默认选中的模型
    let currentModel = settings.defaultModel;
    
    // 如果默认模型未启用，选择第一个启用的模型
    if (!enabledModels.find(model => model.id === currentModel) && enabledModels.length > 0) {
        currentModel = enabledModels[0].id;
    }
    
    // 更新选中状态
    updateSelectedModel(currentModel);

    // 切换下拉菜单
    modelSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        modelSelector.classList.toggle('active');
        modelDropdown.classList.toggle('show');
    });

    // 选择模型
    modelDropdown.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const model = option.dataset.model;
            
            if (model === 'settings') {
                settingsDialog.show();
                modelDropdown.classList.remove('show');
                modelSelector.classList.remove('active');
                return;
            }
            
            if (model === 'none') {
                settingsDialog.show();
                modelDropdown.classList.remove('show');
                modelSelector.classList.remove('active');
                return;
            }
            
            updateSelectedModel(model);
            modelDropdown.classList.remove('show');
            modelSelector.classList.remove('active');
        });
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
        modelDropdown.classList.remove('show');
        modelSelector.classList.remove('active');
    });

    // 监听设置变更事件
    window.addEventListener('settingsChanged', () => {
        initializeModelDropdown();
    });
}

// 更新选中的模型
function updateSelectedModel(model) {
    const modelDropdown = document.querySelector('.model-dropdown');
    
    // 更新选中状态
    modelDropdown.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.model === model);
    });
    
    // 设置当前模型
    window.currentModel = model;
}

// 获取当前选中的模型
window.getCurrentModel = () => ({
    model: window.currentModel || 'tongyi'
});

// Markdown 导入/导出按钮事件
importMarkdownButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md, .txt'; // 接受 .md 和 .txt 文件
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await markdownHandler.handleFileImport(file);
        }
    };
    input.click();
});

exportMarkdownButton.addEventListener('click', () => {
    markdownHandler.exportMarkdown();
});

// 段落卡片管理按钮事件
addParagraphButton.addEventListener('click', () => {
    const card = markdownHandler.createCard('新段落...');
    // 将新卡片放置在可见区域的中间或一个合适的位置
    const containerRect = paragraphContainer.getBoundingClientRect();
    const scrollTop = paragraphContainer.scrollTop;
    card.style.left = `${containerRect.width / 2 - 150}px`; 
    card.style.top = `${scrollTop + containerRect.height / 2 - 75}px`;
});

clearParagraphsButton.addEventListener('click', () => {
    showConfirm('确定要删除所有段落卡片吗？此操作不可撤销。').then(confirmed => {
        if (confirmed) {
            markdownHandler.cards.forEach(card => {
                 if (window.connectionManager) {
                    const textCardPort = card.querySelector('.text-card-port');
                    if (textCardPort) {
                        window.connectionManager.removePortConnection(textCardPort);
                    }
                    const chainPort = card.querySelector('.text-card-chain-port');
                    if (chainPort) {
                        window.connectionManager.removePortConnection(chainPort);
                    }
                    window.connectionManager.connections.forEach((connection) => {
                        if (connection.endPort.closest('.paragraph-card')?.dataset.cardId === card.dataset.cardId) {
                            window.connectionManager.removePortConnection(connection.startPort);
                        }
                    });
                }
                card.remove();
            });
            markdownHandler.cards = []; // 清空内部卡片数组
            // 如果有计数器也需要重置
            markdownHandler.importCount = 0; 
        }
    });
}); 