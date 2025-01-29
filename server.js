const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3000;

// 启用 CORS
app.use(cors());
app.use(express.json());
// 服务静态文件
app.use(express.static(path.join(__dirname, '.')));

// 代理 API 请求
app.post('/api/chat', async (req, res) => {
    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${req.headers.authorization}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('API调用错误:', error.response?.data || error.message);
        res.status(500).json({
            error: error.response?.data || '服务器错误'
        });
    }
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 