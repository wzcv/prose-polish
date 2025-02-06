export class ConnectionManager {
    constructor() {
        this.connections = new Map(); // 存储所有连接
        this.portConnections = new Map(); // 存储端口的连接状态
        this.chainConnections = new Map(); // 存储链式连接的状态
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
            const port = e.target.closest('.connection-port, .text-card-port, .text-card-chain-port');
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

            const endPort = e.target.closest('.connection-port, .text-card-port, .text-card-chain-port');
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
        // 对于文本卡片的蓝色插座，允许同时连接提示词卡片和其他文本卡片
        if (port.classList.contains('text-card-port')) {
            // 获取当前端口的连接ID
            const portId = port.dataset.cardId;
            const chainConnectionId = this.portConnections.get(`${portId}_chain`);
            const promptConnectionId = this.portConnections.get(`${portId}_prompt`);
            
            // 如果当前尝试建立的是链式连接（来自紫色插头）
            if (this.startPort?.classList.contains('text-card-chain-port')) {
                // 只检查是否已经有来自其他文本卡片的链式连接
                return chainConnectionId !== undefined;
            }
            // 如果当前尝试建立的是提示词连接
            if (this.startPort?.classList.contains('connection-port')) {
                // 只检查是否已经有来自提示词卡片的连接
                return promptConnectionId !== undefined;
            }
            return false;
        }
        
        // 对于紫色插头，只检查它自己的连接状态
        if (port.classList.contains('text-card-chain-port')) {
            return this.portConnections.has(port.dataset.cardId);
        }
        
        // 对于提示词卡片的黄色插头，保持单一连接
        return this.portConnections.has(port.dataset.portId);
    }

    // 添加端口连接
    addPortConnection(port1, port2, connectionId) {
        const port1Id = port1.dataset.portId || port1.dataset.cardId;
        const port2Id = port2.dataset.portId || port2.dataset.cardId;
        
        // 如果是文本卡片的蓝色插座，使用复合键来存储不同类型的连接
        if (port2.classList.contains('text-card-port')) {
            const connectionType = port1.classList.contains('text-card-chain-port') ? 'chain' : 'prompt';
            this.portConnections.set(`${port2Id}_${connectionType}`, connectionId);
        } else {
            this.portConnections.set(port2Id, connectionId);
        }
        
        // 对于发起连接的端口，始终使用单一连接
        this.portConnections.set(port1Id, connectionId);
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
        const isTextCardPort = port.classList.contains('text-card-port');
        let connectionIds = [];
        
        if (isTextCardPort) {
            // 对于文本卡片的蓝色插座，获取所有类型的连接
            const portId = port.dataset.cardId;
            const chainConnectionId = this.portConnections.get(`${portId}_chain`);
            const promptConnectionId = this.portConnections.get(`${portId}_prompt`);
            if (chainConnectionId) connectionIds.push(chainConnectionId);
            if (promptConnectionId) connectionIds.push(promptConnectionId);
            
            // 移除连接类型标识
            port.classList.remove('prompt-connected', 'chain-connected');
        } else {
            // 对于其他端口，获取单一连接
            const connectionId = this.portConnections.get(port.dataset.portId || port.dataset.cardId);
            if (connectionId) connectionIds.push(connectionId);
        }

        // 移除所有相关连接
        connectionIds.forEach(connectionId => {
            const connection = this.connections.get(connectionId);
            if (connection) {
                // 移除连接状态类
                connection.startPort.classList.remove('connected');
                connection.endPort.classList.remove('connected');
                // 移除连接线
                connection.line.remove();
                // 移除连接记录
                this.connections.delete(connectionId);

                // 清理端口连接状态
                const startPort = connection.startPort;
                const endPort = connection.endPort;
                
                if (startPort.classList.contains('text-card-chain-port')) {
                    this.portConnections.delete(`${endPort.dataset.cardId}_chain`);
                } else if (startPort.classList.contains('connection-port')) {
                    this.portConnections.delete(`${endPort.dataset.cardId}_prompt`);
                }
                this.portConnections.delete(startPort.dataset.portId || startPort.dataset.cardId);

                // 更新提示词卡片的连接状态
                if (startPort.classList.contains('connection-port')) {
                    const promptCard = this.getPromptCard(startPort);
                    if (promptCard) {
                        const portIndex = parseInt(startPort.dataset.portId.split('_port_')[1]) - 1;
                        promptCard.removeConnection(portIndex);
                    }
                }
            }
        });
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

        // 根据连接类型添加额外的类名
        if (endPort.classList.contains('text-card-port')) {
            if (this.startPort.classList.contains('connection-port')) {
                endPort.classList.add('prompt-connected');
            } else if (this.startPort.classList.contains('text-card-chain-port')) {
                endPort.classList.add('chain-connected');
            }
        }

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

        // 处理不同类型的连接
        if (this.startPort.classList.contains('text-card-chain-port') || 
            endPort.classList.contains('text-card-chain-port')) {
            // 文本卡片链接
            this.handleChainConnection(this.startPort, endPort);
        } else {
            // 提示词卡片连接
            this.handlePromptConnection(this.startPort, endPort);
        }

        // 立即更新连接线位置，确保端点在端口中心
        const startRect = this.startPort.getBoundingClientRect();
        const endRect = endPort.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;
        
        const path = this.createCurvePath(startX, startY, endX, endY);
        this.currentConnection.setAttribute('d', path);

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

        // 检查是否是文本卡片之间的链接
        const isChainConnection = startPort.classList.contains('text-card-chain-port') || 
                                endPort.classList.contains('text-card-chain-port');
        
        if (isChainConnection) {
            // 文本卡片链接的规则：
            // 1. 一个是紫色插头，一个是蓝色插座
            const isStartChain = startPort.classList.contains('text-card-chain-port');
            const isEndSocket = endPort.classList.contains('text-card-port');
            
            // 2. 防止形成环
            if (isStartChain && isEndSocket) {
                return !this.wouldFormLoop(startPort, endPort);
            }
            return false;
        }

        // 原有的提示词卡片连接规则
        const isStartPrompt = startPort.classList.contains('connection-port');
        const isEndText = endPort.classList.contains('text-card-port');
        const isStartText = startPort.classList.contains('text-card-port');
        const isEndPrompt = endPort.classList.contains('connection-port');

        return (isStartPrompt && isEndText) || (isStartText && isEndPrompt);
    }

    // 检查是否会形成环
    wouldFormLoop(startPort, endPort) {
        const startCard = startPort.closest('.paragraph-card');
        const endCard = endPort.closest('.paragraph-card');
        
        // 检查是否已经存在从终点到起点的路径
        const visited = new Set();
        const checkPath = (currentCard) => {
            if (currentCard === startCard) return true;
            if (visited.has(currentCard)) return false;
            
            visited.add(currentCard);
            const chainPort = currentCard.querySelector('.text-card-chain-port');
            if (!chainPort) return false;
            
            const connectionId = this.portConnections.get(chainPort.dataset.cardId);
            if (!connectionId) return false;
            
            const connection = this.connections.get(connectionId);
            if (!connection) return false;
            
            const nextCard = connection.endPort.closest('.paragraph-card');
            return checkPath(nextCard);
        };
        
        return checkPath(endCard);
    }

    // 创建贝塞尔曲线路径
    createCurvePath(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;

        // 检查是否是文本卡片之间的链接（通过检查起点是否是紫色插头）
        const isChainConnection = this.startPort?.classList.contains('text-card-chain-port');
        
        if (isChainConnection) {
            // 文本卡片之间的链接：使用竖直控制点
            // 确保终点的控制点永远在终点上方
            const distance = Math.abs(dy); // 计算垂直距离
            const controlY1 = startY + dy * 0.5; // 起点控制点
            const controlY2 = endY - 60; // 终点控制点固定在终点上方50px处
            
            // 如果起点在终点下方，增加控制点的垂直距离以获得更平滑的曲线
            if (startY > endY) {
                return `M ${startX} ${startY} C ${startX} ${startY - distance * 0.5}, ${endX} ${controlY2}, ${endX} ${endY}`;
            } else {
                return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
            }
        } else {
            // 提示词卡片到文本卡片的链接：使用水平控制点
            // 调整控制点权重，使终点处的弯曲更明显
            const controlX1 = startX + dx * 0.3; // 起点控制点权重减小到0.3
            const controlY1 = startY;
            const controlX2 = endX - dx * 0.7;   // 终点控制点权重增加到0.7
            const controlY2 = endY;
            return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
        }
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

            // 临时保存当前的startPort，以便createCurvePath方法使用
            const originalStartPort = this.startPort;
            this.startPort = connection.startPort;
            
            const path = this.createCurvePath(startX, startY, endX, endY);
            connection.line.setAttribute('d', path);
            
            // 恢复原始的startPort
            this.startPort = originalStartPort;
        });
    }

    // 处理文本卡片之间的链接
    handleChainConnection(startPort, endPort) {
        const startCard = startPort.closest('.paragraph-card');
        const endCard = endPort.closest('.paragraph-card');
        
        // 记录链接关系
        this.chainConnections.set(startCard.dataset.cardId, endCard.dataset.cardId);
    }

    // 处理提示词卡片的连接
    handlePromptConnection(startPort, endPort) {
        const promptPort = startPort.classList.contains('connection-port') ? startPort : endPort;
        const textPort = startPort.classList.contains('text-card-port') ? startPort : endPort;
        const promptCard = this.getPromptCard(promptPort);
        const textCard = this.getTextCard(textPort);

        if (promptCard && textCard) {
            const portIndex = parseInt(promptPort.dataset.portId.split('_port_')[1]) - 1;
            // 获取链接文本，包括所有链接的卡片
            const content = this.getCombinedContent(textCard);
            promptCard.updateConnection(portIndex, content);
        }
    }

    // 获取组合后的文本内容
    getCombinedContent(startCard) {
        const contents = [];
        let currentCard = startCard;
        const visited = new Set();

        while (currentCard && !visited.has(currentCard.dataset.cardId)) {
            visited.add(currentCard.dataset.cardId);
            contents.push(currentCard.querySelector('.card-content').textContent);

            // 查找下一个链接的卡片
            const chainPort = currentCard.querySelector('.text-card-chain-port');
            if (!chainPort) break;

            const connectionId = this.portConnections.get(chainPort.dataset.cardId);
            if (!connectionId) break;

            const connection = this.connections.get(connectionId);
            if (!connection) break;

            currentCard = connection.endPort.closest('.paragraph-card');
            if (visited.has(currentCard?.dataset.cardId)) break;
        }

        return contents.join('\\n');
    }
} 