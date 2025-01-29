export class MarkdownHandler {
    constructor(containerElement) {
        this.container = containerElement;
        this.cards = [];
        this.currentZIndex = 1;  // 跟踪最高的 z-index
        this.setupDragAndDrop();
    }

    // 处理文件导入
    async handleFileImport(file) {
        try {
            const content = await this.readFile(file);
            const paragraphs = this.splitIntoParagraphs(content);
            this.createCards(paragraphs);
        } catch (error) {
            console.error('文件处理错误:', error);
            alert('文件处理出错，请重试');
        }
    }

    // 读取文件内容
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // 将文本分割成段落
    splitIntoParagraphs(content) {
        return content.split(/\n\s*\n/).filter(p => p.trim());
    }

    // 创建段落卡片
    createCards(paragraphs) {
        this.container.innerHTML = '';
        this.cards = [];
        this.currentZIndex = 1;

        paragraphs.forEach((text, index) => {
            this.createCard(text, index);
        });
    }

    // 创建单个卡片
    createCard(text = '', index = this.cards.length) {
        const card = document.createElement('div');
        card.className = 'paragraph-card';
        card.dataset.editable = 'false';  // 添加编辑状态标记
        card.dataset.cardId = 'text_card_' + Date.now() + '_' + index;
        
        // 添加连接端口
        const connectionPort = document.createElement('div');
        connectionPort.className = 'text-card-port';
        connectionPort.dataset.cardId = card.dataset.cardId;
        card.appendChild(connectionPort);
        
        // 添加删除按钮
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('确定要删除这个卡片吗？')) {
                card.remove();
                this.cards = this.cards.filter(c => c !== card);
            }
        };
        actions.appendChild(deleteBtn);
        card.appendChild(actions);
        
        // 添加内容区域
        const content = document.createElement('div');
        content.className = 'card-content';
        content.contentEditable = 'false';
        content.textContent = text;
        
        // 双击启用编辑
        content.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            content.contentEditable = 'true';
            card.dataset.editable = 'true';
            card.style.cursor = 'text';
            content.focus();
        });
        
        // 失去焦点时保存
        content.addEventListener('blur', () => {
            content.contentEditable = 'false';
            card.dataset.editable = 'false';
            card.style.cursor = 'move';
        });
        
        // 按下回车时保存（避免换行）
        content.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                content.blur();
            }
        });
        
        card.appendChild(content);
        
        card.style.position = 'absolute';
        card.style.left = `${10}px`;
        card.style.top = `${10 + index * 160}px`;
        card.style.zIndex = index + 1;
        
        this.cards.push(card);
        this.container.appendChild(card);
        return card;
    }

    // 设置拖拽功能
    setupDragAndDrop() {
        let draggedCard = null;
        let initialMouseX = 0;
        let initialMouseY = 0;
        let initialCardX = 0;
        let initialCardY = 0;

        // 鼠标按下时
        const mouseDown = (e) => {
            const card = e.target.closest('.paragraph-card');
            if (!card || card.dataset.editable === 'true') return;  // 编辑状态下不允许拖拽

            draggedCard = card;
            draggedCard.style.transition = 'none';
            
            // 记录初始状态
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            initialCardX = parseInt(card.style.left) || 0;
            initialCardY = parseInt(card.style.top) || 0;
            
            // 提升卡片层级
            this.currentZIndex++;
            card.style.zIndex = this.currentZIndex;
            
            // 阻止默认事件和冒泡
            e.preventDefault();
            e.stopPropagation();
        };

        // 鼠标移动时
        const mouseMove = (e) => {
            if (!draggedCard) return;
            e.preventDefault();

            // 计算鼠标移动的距离
            const deltaX = e.clientX - initialMouseX;
            const deltaY = e.clientY - initialMouseY;

            // 直接设置新位置
            draggedCard.style.left = `${initialCardX + deltaX}px`;
            draggedCard.style.top = `${initialCardY + deltaY}px`;

            // 更新连接线
            window.connectionManager?.updateConnections();
        };

        // 鼠标松开时
        const mouseUp = () => {
            if (draggedCard) {
                // 恢复过渡效果
                draggedCard.style.transition = '';
                draggedCard = null;
            }
        };

        // 添加事件监听
        this.container.addEventListener('mousedown', mouseDown, { passive: false });
        document.addEventListener('mousemove', mouseMove, { passive: false });
        document.addEventListener('mouseup', mouseUp);
    }

    // 获取当前排序后的文本
    getCurrentText() {
        return [...this.container.querySelectorAll('.paragraph-card')]
            .map(card => card.textContent)
            .join('\n\n');
    }

    // 添加新卡片
    addNewCard(e) {
        const newCard = this.createCard('', this.cards.length);
        
        // 获取容器的位置信息
        const containerRect = this.container.getBoundingClientRect();
        
        // 计算鼠标相对于容器的位置
        const relativeX = e.clientX - containerRect.left;
        const relativeY = e.clientY - containerRect.top;
        
        // 设置新卡片位置，稍微偏移一点，避免完全遮盖按钮
        newCard.style.left = `${relativeX - 150}px`;  // 向左偏移卡片宽度的一半
        newCard.style.top = `${relativeY - 75}px`;   // 向上偏移卡片高度的一半
        
        // 确保新卡片在视图内
        const maxX = containerRect.width - 300;  // 卡片宽度
        const maxY = containerRect.height - 150; // 卡片高度
        
        newCard.style.left = `${Math.max(0, Math.min(parseInt(newCard.style.left), maxX))}px`;
        newCard.style.top = `${Math.max(0, Math.min(parseInt(newCard.style.top), maxY))}px`;
    }

    // 初始化事件监听
    init() {
        // 添加新建卡片按钮事件
        const addButton = document.getElementById('add-paragraph');
        if (addButton) {
            addButton.addEventListener('click', (e) => this.addNewCard(e));
        }
    }
} 