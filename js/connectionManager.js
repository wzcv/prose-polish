export class ConnectionManager {
    constructor() {
        this.connections = new Map(); // 存储所有连接
        this.portConnections = new Map(); // 存储端口的连接状态
        this.svgContainer = document.querySelector('.connections-container');
        this.currentConnection = null; // 当前正在创建的连接
        this.startPort = null; // 开始连接的端口
        
        this.setupEventListeners();
        this.setupScrollListeners();
    }

    // 设置事件监听
    setupEventListeners() {
        // 监听所有端口的鼠标按下事件
        document.addEventListener('mousedown', (e) => {
            const port = e.target.closest('.connection-port, .text-card-port');
            if (!port) return;

            this.startConnection(port, e);
        });

        // 监听鼠标移动
        document.addEventListener('mousemove', (e) => {
            if (this.currentConnection) {
                this.updateTempConnection(e);
            }
        });

        // 监听鼠标松开
        document.addEventListener('mouseup', (e) => {
            if (!this.currentConnection) return;

            const endPort = e.target.closest('.connection-port, .text-card-port');
            if (endPort && this.canConnect(this.startPort, endPort)) {
                this.completeConnection(endPort);
            } else {
                this.cancelConnection();
            }
        });
    }

    // 设置滚动监听
    setupScrollListeners() {
        // 监听提示词卡片区域的滚动
        const promptCards = document.querySelector('.prompt-cards');
        promptCards.addEventListener('scroll', () => {
            requestAnimationFrame(() => this.updateConnections());
        });

        // 监听段落卡片区域的滚动
        const paragraphContainer = document.querySelector('.paragraph-container');
        paragraphContainer.addEventListener('scroll', () => {
            requestAnimationFrame(() => this.updateConnections());
        });

        // 监听整个页面的滚动
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => this.updateConnections());
        });

        // 使用 MutationObserver 监听卡片内容变化
        const observer = new MutationObserver(() => {
            requestAnimationFrame(() => this.updateConnections());
        });

        // 监听段落容器的变化
        observer.observe(paragraphContainer, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }

    // 检查端口是否已经连接
    isPortConnected(port) {
        return this.portConnections.has(port.dataset.portId || port.dataset.cardId);
    }

    // 添加端口连接
    addPortConnection(port1, port2, connectionId) {
        this.portConnections.set(port1.dataset.portId || port1.dataset.cardId, connectionId);
        this.portConnections.set(port2.dataset.portId || port2.dataset.cardId, connectionId);
    }

    // 移除卡片的所有连接
    removeCardConnections(cardId) {
        // 找到所有与该卡片相关的端口
        const ports = document.querySelectorAll(`[data-port-id^="${cardId}_port_"]`);
        ports.forEach(port => {
            this.removePortConnection(port);
        });
    }

    // 移除端口连接
    removePortConnection(port) {
        const connectionId = this.portConnections.get(port.dataset.portId || port.dataset.cardId);
        if (connectionId) {
            const connection = this.connections.get(connectionId);
            if (connection) {
                // 移除连接状态类
                connection.startPort.classList.remove('connected');
                connection.endPort.classList.remove('connected');
                // 移除连接线
                connection.line.remove();
                // 移除连接记录
                this.connections.delete(connectionId);
                // 移除两个端口的连接状态
                this.portConnections.delete(connection.startPort.dataset.portId || connection.startPort.dataset.cardId);
                this.portConnections.delete(connection.endPort.dataset.portId || connection.endPort.dataset.cardId);

                // 更新提示词卡片的连接状态
                const promptPort = connection.startPort.classList.contains('connection-port') ? connection.startPort : connection.endPort;
                const promptCard = this.getPromptCard(promptPort);
                if (promptCard) {
                    const portIndex = parseInt(promptPort.dataset.portId.split('_port_')[1]) - 1;
                    promptCard.removeConnection(portIndex);
                }
            }
        }
    }

    // 开始创建连接
    startConnection(port, event) {
        // 如果端口已经连接，先移除旧连接
        if (this.isPortConnected(port)) {
            this.removePortConnection(port);
        }

        this.startPort = port;
        port.classList.add('connecting');

        // 添加防止选择的类
        document.body.classList.add('connecting-mode');

        // 创建临时连接线
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.classList.add('connection-line', 'temp');
        this.svgContainer.appendChild(line);
        this.currentConnection = line;

        // 更新连接线位置
        this.updateTempConnection(event);
    }

    // 更新临时连接线
    updateTempConnection(event) {
        const startRect = this.startPort.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = event.clientX;
        const endY = event.clientY;

        // 创建贝塞尔曲线
        const path = this.createCurvePath(startX, startY, endX, endY);
        this.currentConnection.setAttribute('d', path);
    }

    // 完成连接
    completeConnection(endPort) {
        // 移除防止选择的类
        document.body.classList.remove('connecting-mode');

        // 移除临时状态
        this.startPort.classList.remove('connecting');
        endPort.classList.remove('connecting');

        // 添加连接状态
        this.startPort.classList.add('connected');
        endPort.classList.add('connected');

        // 更新连接线样式
        this.currentConnection.classList.remove('temp');

        // 存储连接信息
        const connectionId = `connection_${Date.now()}`;
        this.connections.set(connectionId, {
            id: connectionId,
            startPort: this.startPort,
            endPort: endPort,
            line: this.currentConnection
        });

        // 记录端口的连接状态
        this.addPortConnection(this.startPort, endPort, connectionId);

        // 更新提示词卡片的连接状态
        const promptPort = this.startPort.classList.contains('connection-port') ? this.startPort : endPort;
        const textPort = this.startPort.classList.contains('text-card-port') ? this.startPort : endPort;
        const promptCard = this.getPromptCard(promptPort);
        const textCard = this.getTextCard(textPort);

        if (promptCard && textCard) {
            const portIndex = parseInt(promptPort.dataset.portId.split('_port_')[1]) - 1;
            const content = textCard.querySelector('.card-content').textContent;
            promptCard.updateConnection(portIndex, content);
        }

        // 重置当前连接状态
        this.currentConnection = null;
        this.startPort = null;
    }

    // 取消连接
    cancelConnection() {
        // 移除防止选择的类
        document.body.classList.remove('connecting-mode');

        if (this.startPort) {
            this.startPort.classList.remove('connecting');
        }
        if (this.currentConnection) {
            this.currentConnection.remove();
        }
        this.currentConnection = null;
        this.startPort = null;
    }

    // 检查是否可以连接
    canConnect(startPort, endPort) {
        if (!startPort || !endPort || startPort === endPort) return false;

        // 如果目标端口已经连接，不允许连接
        if (this.isPortConnected(endPort)) return false;

        // 确保一个是提示词端口，一个是文本卡片端口
        const isStartPrompt = startPort.classList.contains('connection-port');
        const isEndText = endPort.classList.contains('text-card-port');
        const isStartText = startPort.classList.contains('text-card-port');
        const isEndPrompt = endPort.classList.contains('connection-port');

        return (isStartPrompt && isEndText) || (isStartText && isEndPrompt);
    }

    // 创建贝塞尔曲线路径
    createCurvePath(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        const controlX1 = startX + dx * 0.5;
        const controlY1 = startY;
        const controlX2 = endX - dx * 0.5;
        const controlY2 = endY;

        return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    }

    // 获取提示词卡片实例
    getPromptCard(port) {
        const cardElement = port.closest('.prompt-card');
        if (!cardElement) return null;
        return window.cardManager.cards.get(cardElement.id);
    }

    // 获取文本卡片元素
    getTextCard(port) {
        return port.closest('.paragraph-card');
    }

    // 更新所有连接线的位置
    updateConnections() {
        this.connections.forEach(connection => {
            const startRect = connection.startPort.getBoundingClientRect();
            const endRect = connection.endPort.getBoundingClientRect();
            const startX = startRect.left + startRect.width / 2;
            const startY = startRect.top + startRect.height / 2;
            const endX = endRect.left + endRect.width / 2;
            const endY = endRect.top + endRect.height / 2;

            const path = this.createCurvePath(startX, startY, endX, endY);
            connection.line.setAttribute('d', path);
        });
    }
} 