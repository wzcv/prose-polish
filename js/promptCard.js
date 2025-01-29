// 生成唯一ID的辅助函数
function generateUniqueId(prefix = 'card') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 提示词卡片类
export class PromptCard {
    constructor(id, title, prompt, placeholders = []) {
        this.id = id;
        this.title = title;
        this.prompt = prompt;
        this.placeholders = this.detectPlaceholders(prompt);  // 使用检测到的占位符
        this.connections = new Array(this.placeholders.length).fill(null);
        this.element = this.createCardElement();
    }

    // 检测提示词中的占位符
    detectPlaceholders(text) {
        const regex = /\{\{([^}]+)\}\}/g;
        const placeholders = [];
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            placeholders.push(match[1].trim());
        }
        
        return placeholders;
    }

    // 更新卡片内容
    updateContent(title, prompt) {
        this.title = title;
        this.prompt = prompt;
        
        // 检测新的占位符
        const newPlaceholders = this.detectPlaceholders(prompt);
        
        // 如果占位符数量或内容发生变化，需要重新创建端口
        if (JSON.stringify(this.placeholders) !== JSON.stringify(newPlaceholders)) {
            this.placeholders = newPlaceholders;
            this.connections = new Array(this.placeholders.length).fill(null);
            
            // 移除旧的端口和连接
            const portContainer = this.element.querySelector('.port-container');
            if (portContainer) {
                // 移除所有现有连接
                const ports = portContainer.querySelectorAll('.connection-port');
                ports.forEach(port => {
                    if (window.connectionManager) {
                        window.connectionManager.removePortConnection(port);
                    }
                });
                portContainer.innerHTML = '';
            }
            
            // 创建新的端口
            this.createPorts(portContainer);
        }

        // 更新显示内容
        this.element.querySelector('h3').textContent = this.title;
        this.element.querySelector('.card-prompt').textContent = this.prompt;
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.id = this.id;
        
        // 创建卡片内容
        card.innerHTML = `
            <div class="card-actions">
                <button class="edit-btn">✎</button>
                <button class="delete-btn">✕</button>
            </div>
            <h3>${this.title}</h3>
            <div class="card-prompt">${this.prompt}</div>
            <div class="port-container"></div>
        `;

        // 创建端口
        const portContainer = card.querySelector('.port-container');
        this.createPorts(portContainer);

        return card;
    }

    // 创建端口
    createPorts(container) {
        this.placeholders.forEach((placeholder, index) => {
            const port = document.createElement('div');
            port.className = 'connection-port';
            port.dataset.portId = `${this.id}_port_${index + 1}`;
            
            // 添加占位符名称标签
            const label = document.createElement('span');
            label.className = 'port-label';
            label.textContent = placeholder;
            
            port.appendChild(label);
            container.appendChild(port);
        });
    }

    // 检查所有端口是否都已连接
    areAllPortsConnected() {
        return this.connections.every(connection => connection !== null);
    }

    // 获取未连接的端口序号
    getUnconnectedPorts() {
        return this.connections
            .map((connection, index) => connection === null ? this.placeholders[index] : null)
            .filter(index => index !== null);
    }

    // 更新连接状态
    updateConnection(portIndex, content) {
        this.connections[portIndex] = { content };
    }

    // 移除连接状态
    removeConnection(portIndex) {
        this.connections[portIndex] = null;
    }

    // 获取替换了占位符的提示词
    getPromptWithConnections() {
        // 检查是否所有端口都已连接
        if (!this.areAllPortsConnected()) {
            const unconnectedPorts = this.getUnconnectedPorts();
            throw new Error(`以下变量未连接：${unconnectedPorts.join(', ')}`);
        }

        let result = this.prompt;
        this.placeholders.forEach((placeholder, index) => {
            const pattern = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
            result = result.replace(pattern, this.connections[index].content);
        });
        
        // 添加固定的后缀文本
        result += '\n\n请你直接给出结果，不要做任何解释';
        
        return result;
    }
}

// 提示词卡片管理器
export class PromptCardManager {
    constructor(containerElement) {
        this.container = containerElement;
        this.cards = new Map();
        this.selectedCard = null;
        this.onCardSelected = null;
        this.debouncedSelect = debounce(this.selectCard.bind(this), 100);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 使用事件委托来处理卡片的点击事件
        this.container.addEventListener('click', (e) => {
            const promptCard = e.target.closest('.prompt-card');
            if (!promptCard) return;

            // 处理编辑按钮点击
            if (e.target.matches('.edit-btn')) {
                e.stopPropagation();
                this.showEditDialog(promptCard.id);
                return;
            }

            // 处理删除按钮点击
            if (e.target.matches('.delete-btn')) {
                e.stopPropagation();
                if (confirm('确定要删除这个提示词卡片吗？')) {
                    this.deleteCard(promptCard.id);
                }
                return;
            }

            // 处理卡片选择
            if (!e.target.matches('button')) {
                this.debouncedSelect(promptCard.id);
            }
        });
    }

    // 检查ID是否已存在
    isIdExists(id) {
        return this.cards.has(id) || document.getElementById(id) !== null;
    }

    // 添加新卡片
    addCard(title, prompt) {
        let card = new PromptCard(generateUniqueId(), title, prompt);
        
        while (this.isIdExists(card.id)) {
            card = new PromptCard(generateUniqueId(), title, prompt);
        }

        this.cards.set(card.id, card);
        this.container.appendChild(card.element);
        return card;
    }

    // 删除卡片
    deleteCard(cardId) {
        const cardElement = document.getElementById(cardId);
        if (cardElement) {
            cardElement.remove();
            this.cards.delete(cardId);
            if (this.selectedCard?.id === cardId) {
                this.selectedCard = null;
                this.onCardSelected?.(null);
            }
        }
    }

    // 编辑卡片
    editCard(cardId, title, prompt) {
        const card = this.cards.get(cardId);
        if (card) {
            card.updateContent(title, prompt);
        }
    }

    // 选择卡片
    selectCard(cardId) {
        if (!cardId || !this.cards.has(cardId)) return;
        if (this.selectedCard?.id === cardId) return;

        const allCards = this.container.querySelectorAll('.prompt-card');
        allCards.forEach(card => card.classList.remove('selected'));

        this.selectedCard = null;

        const cardElement = document.getElementById(cardId);
        if (cardElement) {
            const card = this.cards.get(cardId);
            if (card) {
                cardElement.classList.add('selected');
                this.selectedCard = card;
            }
        }
        
        if (this.onCardSelected) {
            this.onCardSelected(this.selectedCard);
        }
    }

    // 显示编辑对话框
    showEditDialog(cardId) {
        const card = cardId ? this.cards.get(cardId) : { title: '', prompt: '' };
        if (!card) return;

        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>${cardId ? '编辑提示词' : '新建提示词'}</h3>
                <input type="text" id="edit-title" placeholder="标题" value="${card.title || ''}">
                <textarea id="edit-prompt" placeholder="提示词内容" rows="4">${card.prompt || ''}</textarea>
                <div class="dialog-buttons">
                    <button id="save-edit">保存</button>
                    <button id="cancel-edit">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 保存按钮事件
        dialog.querySelector('#save-edit').addEventListener('click', () => {
            const title = dialog.querySelector('#edit-title').value;
            const prompt = dialog.querySelector('#edit-prompt').value;

            if (title && prompt) {
                if (cardId) {
                    this.editCard(cardId, title, prompt);
                } else {
                    this.addCard(title, prompt);
                }
                dialog.remove();
            } else {
                alert('标题和提示词内容不能为空');
            }
        });

        // 取消按钮事件
        dialog.querySelector('#cancel-edit').addEventListener('click', () => {
            dialog.remove();
        });
    }

    // 获取选中的提示词
    getSelectedPrompt() {
        return this.selectedCard?.prompt || null;
    }
} 