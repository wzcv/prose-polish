/**
 * API服务 - 处理不同模型的API调用
 */
import { SettingsManager } from './settingsManager.js';

export class ApiService {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.settings = this.settingsManager.getSettings();
    
    // 监听设置变更事件
    window.addEventListener('settingsChanged', () => {
      this.reloadSettings();
    });
  }

  /**
   * 重新加载设置
   */
  reloadSettings() {
    this.settings = this.settingsManager.getSettings();
    console.log('ApiService reloaded settings:', this.settings);
  }

  /**
   * 调用AI API
   * @param {string} message - 用户消息
   * @param {string} modelType - 模型类型
   * @param {HTMLElement} outputElement - 输出元素，用于流式输出
   * @returns {Promise<string>} - 返回AI回复
   */
  async callAI(message, modelType, outputElement) {
    // 检查模型类型
    switch (modelType) {
      case 'tongyi':
        return this.callTongyi(message, outputElement);
      case 'deepseek-v3':
        return this.callDeepSeek(message, 'V3', outputElement);
      case 'deepseek-r1':
        return this.callDeepSeek(message, 'R1', outputElement);
      case 'openai':
        return this.callOpenAI(message, outputElement);
      case 'gemini':
        return this.callGemini(message, outputElement);
      case 'custom':
        return this.callCustomModel(message, outputElement);
      default:
        throw new Error(`不支持的模型类型: ${modelType}`);
    }
  }

  /**
   * 调用通义千问API
   */
  async callTongyi(message, outputElement) {
    const model = this.settings.models.tongyi;
    
    if (!model.enabled) {
      throw new Error('通义千问API未启用，请在设置中启用并配置API密钥');
    }
    
    if (!model.apiKey) {
      throw new Error('通义千问API密钥未配置，请在设置中配置API密钥');
    }
    
    try {
      const response = await fetch(model.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': model.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.model,
          messages: [
            this.settings.systemMessage,
            {
              role: 'user',
              content: message
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('通义千问API错误:', errorData);
        throw new Error(`API调用失败: ${errorData.message || '未知错误'}`);
      }

      // 处理流式响应
      return this.handleOpenAICompatibleStream(response, outputElement);
    } catch (error) {
      console.error('调用通义千问API失败:', error);
      throw error;
    }
  }

  /**
   * 调用DeepSeek API
   */
  async callDeepSeek(message, version, outputElement) {
    const model = this.settings.models.deepseek;
    
    if (!model.enabled) {
      throw new Error('DeepSeek API未启用，请在设置中启用并配置API密钥');
    }
    
    if (!model.apiKey) {
      throw new Error('DeepSeek API密钥未配置，请在设置中配置API密钥');
    }
    
    const modelName = model.models[version];
    
    try {
      const response = await fetch(`${model.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            this.settings.systemMessage,
            {
              role: 'user',
              content: message
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('DeepSeek API错误:', errorData);
        throw new Error(`API调用失败: ${errorData.error?.message || '未知错误'}`);
      }

      // 处理流式响应
      return this.handleOpenAICompatibleStream(response, outputElement);
    } catch (error) {
      console.error('调用DeepSeek API失败:', error);
      throw error;
    }
  }

  /**
   * 调用OpenAI API
   */
  async callOpenAI(message, outputElement) {
    const model = this.settings.models.openai;
    
    if (!model.enabled) {
      throw new Error('OpenAI API未启用，请在设置中启用并配置API密钥');
    }
    
    if (!model.apiKey) {
      throw new Error('OpenAI API密钥未配置，请在设置中配置API密钥');
    }
    
    try {
      const response = await fetch(model.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.model,
          messages: [
            this.settings.systemMessage,
            {
              role: 'user',
              content: message
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API错误:', errorData);
        throw new Error(`API调用失败: ${errorData.error?.message || '未知错误'}`);
      }

      // 处理流式响应
      return this.handleOpenAICompatibleStream(response, outputElement);
    } catch (error) {
      console.error('调用OpenAI API失败:', error);
      throw error;
    }
  }

  /**
   * 调用Gemini API
   */
  async callGemini(message, outputElement) {
    const model = this.settings.models.gemini;
    
    if (!model.enabled) {
      throw new Error('Gemini API未启用，请在设置中启用并配置API密钥');
    }
    
    if (!model.apiKey) {
      throw new Error('Gemini API密钥未配置，请在设置中配置API密钥');
    }
    
    try {
      const apiUrl = `${model.baseUrl}/${model.model}:streamGenerateContent?key=${model.apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${this.settings.systemMessage.content}\n\n${message}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API错误:', errorData);
        throw new Error(`API调用失败: ${errorData.error?.message || '未知错误'}`);
      }

      // 处理Gemini流式响应
      return this.handleGeminiStream(response, outputElement);
    } catch (error) {
      console.error('调用Gemini API失败:', error);
      throw error;
    }
  }

  /**
   * 调用自定义模型API
   */
  async callCustomModel(message, outputElement) {
    const model = this.settings.models.custom;
    
    if (!model.enabled) {
      throw new Error('自定义模型API未启用，请在设置中启用并配置API密钥');
    }
    
    if (!model.apiKey || !model.baseUrl || !model.model) {
      throw new Error('自定义模型配置不完整，请在设置中完成配置');
    }
    
    try {
      const response = await fetch(model.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.model,
          messages: [
            this.settings.systemMessage,
            {
              role: 'user',
              content: message
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('自定义模型API错误:', errorData);
        throw new Error(`API调用失败: ${errorData.error?.message || '未知错误'}`);
      }

      // 处理流式响应
      return this.handleOpenAICompatibleStream(response, outputElement);
    } catch (error) {
      console.error('调用自定义模型API失败:', error);
      throw error;
    }
  }

  /**
   * 处理OpenAI兼容的流式响应
   */
  async handleOpenAICompatibleStream(response, outputElement) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let buffer = ''; // 用于处理不完整的JSON数据
    
    if (outputElement) {
      outputElement.textContent = '';
    }
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 尝试处理缓冲区中的数据
        let EOL;
        while ((EOL = buffer.indexOf('\n')) >= 0) {
          const line = buffer.substring(0, EOL).trim();
          buffer = buffer.substring(EOL + 1);

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return result;
            }
            
            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices?.[0]?.delta?.content || 
                              parsedData.choices?.[0]?.delta?.reasoning_content || 
                              '';
              
              if (content) {
                result += content;
                
                if (outputElement) {
                  outputElement.textContent += content;
                  outputElement.scrollTop = outputElement.scrollHeight;
                }
              }
            } catch (e) {
              console.warn('解析OpenAI兼容流数据失败 (可能是部分数据): ', e, '原始数据: ', data);
            }
          }
        }
      }
      // 处理缓冲区中剩余的数据 (如果存在)
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6).trim();
        if (data !== '[DONE]') {
          try {
            const parsedData = JSON.parse(data);
            const content = parsedData.choices?.[0]?.delta?.content || 
                            parsedData.choices?.[0]?.delta?.reasoning_content || 
                            '';
            if (content) {
              result += content;
              if (outputElement) {
                outputElement.textContent += content;
                outputElement.scrollTop = outputElement.scrollHeight;
              }
            }
          } catch (e) {
            console.error('处理OpenAI兼容流结束时解析数据失败:', e, '原始数据: ', data);
          }
        }
      }
    } catch (e) {
      console.error('读取OpenAI兼容流失败:', e);
      throw e;
    }
    
    return result;
  }

  /**
   * 处理Gemini流式响应
   */
  async handleGeminiStream(response, outputElement) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let buffer = ''; // 用于处理不完整的JSON数据块
    
    if (outputElement) {
      outputElement.textContent = '';
    }
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 尝试将整个缓冲区解析为一个JSON数组
        // Gemini的流通常是一个JSON数组，或者由换行符分隔的JSON对象列表
        // 这里我们优先处理数组格式，如果失败，再尝试按行处理
        try {
          // 尝试解析整个缓冲区为一个JSON数组
          // 移除可能存在的不匹配的开头/结尾逗号或方括号
          let cleanedBuffer = buffer.trim();
          if (cleanedBuffer.startsWith('[') && cleanedBuffer.endsWith(']')) {
            // 如果已经是完整的数组格式，直接解析
          } else if (cleanedBuffer.startsWith('[')) {
            // 如果以'['开头，但没有以']'结尾，尝试补全
            if (cleanedBuffer.lastIndexOf(',') === cleanedBuffer.length -1) {
                 cleanedBuffer = cleanedBuffer.slice(0, -1); // 移除末尾逗号
            }
            cleanedBuffer += ']';
          } else if (cleanedBuffer.endsWith(']')) {
            // 如果以']'结尾，但没有以'['开头，尝试补全
             if (cleanedBuffer.indexOf(',') === 0) {
                 cleanedBuffer = cleanedBuffer.substring(1); // 移除开头逗号
            }
            cleanedBuffer = '[' + cleanedBuffer;
          } else {
            // 如果既不以'['开头也不以']'结尾，尝试将其视为逗号分隔的对象列表
            if (cleanedBuffer.lastIndexOf(',') === cleanedBuffer.length -1) {
                 cleanedBuffer = cleanedBuffer.slice(0, -1); // 移除末尾逗号
            }
            if (cleanedBuffer.indexOf(',') === 0) {
                 cleanedBuffer = cleanedBuffer.substring(1); // 移除开头逗号
            }
            cleanedBuffer = '[' + cleanedBuffer + ']';
          }

          const jsonDataArray = JSON.parse(cleanedBuffer);

          if (Array.isArray(jsonDataArray)) {
            for (const item of jsonDataArray) {
              const content = item.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                result += content;
                if (outputElement) {
                  // 逐字追加，而不是覆盖，以实现流式效果
                  outputElement.textContent += content;
                  outputElement.scrollTop = outputElement.scrollHeight;
                }
              }
            }
            buffer = ''; // 成功解析并处理了整个缓冲区
          } else {
            // 如果解析结果不是数组，可能数据不完整，保留在缓冲区
          }
        } catch (e) {
          // 解析为数组失败，可能是数据不完整或格式不同
          // 尝试按行处理（如果包含换行符）
          let EOL;
          let consumedThisIteration = false;
          while ((EOL = buffer.indexOf('\n')) >= 0) {
            const line = buffer.substring(0, EOL).trim();
            buffer = buffer.substring(EOL + 1);
            consumedThisIteration = true;

            if (line) {
              try {
                const parsedData = JSON.parse(line);
                const content = parsedData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (content) {
                  result += content;
                  if (outputElement) {
                    outputElement.textContent += content;
                    outputElement.scrollTop = outputElement.scrollHeight;
                  }
                }
              } catch (lineError) {
                // 单行解析失败，可能是不完整的JSON片段，保留在buffer的开头部分
                // 将其放回缓冲区的前面，等待更多数据
                buffer = line + buffer; 
                consumedThisIteration = false; // 因为数据被放回，所以不算消耗
                break; // 跳出内部while循环，等待更多数据
              }
            }
          }
          // 如果本次迭代没有消耗任何数据（例如，只有不完整的行），则不清除buffer
          if (!consumedThisIteration && !buffer.includes('\n') && buffer.trim().length > 0) {
            // 如果缓冲区中没有换行符，并且有内容，但解析失败，等待更多数据
          } else if (!consumedThisIteration && buffer.trim().length === 0) {
            buffer = ''; // 如果缓冲区为空，则清空
          }
        }
      }
      
      // 处理流结束后缓冲区中可能剩余的最后一个JSON对象或片段
      if (buffer.trim()) {
        try {
          // 再次尝试将其解析为数组
          let finalCleanedBuffer = buffer.trim();
           if (finalCleanedBuffer.startsWith('[') && finalCleanedBuffer.endsWith(']')) {
            // ok
          } else if (finalCleanedBuffer.startsWith('[')) {
            if (finalCleanedBuffer.lastIndexOf(',') === finalCleanedBuffer.length -1) {
                 finalCleanedBuffer = finalCleanedBuffer.slice(0, -1);
            }
            finalCleanedBuffer += ']';
          } else if (finalCleanedBuffer.endsWith(']')) {
            if (finalCleanedBuffer.indexOf(',') === 0) {
                 finalCleanedBuffer = finalCleanedBuffer.substring(1);
            }
            finalCleanedBuffer = '[' + finalCleanedBuffer;
          } else {
            if (finalCleanedBuffer.lastIndexOf(',') === finalCleanedBuffer.length -1) {
                 finalCleanedBuffer = finalCleanedBuffer.slice(0, -1);
            }
            if (finalCleanedBuffer.indexOf(',') === 0) {
                 finalCleanedBuffer = finalCleanedBuffer.substring(1); 
            }
            finalCleanedBuffer = '[' + finalCleanedBuffer + ']';
          }
          const finalJsonDataArray = JSON.parse(finalCleanedBuffer);
          if (Array.isArray(finalJsonDataArray)) {
            for (const item of finalJsonDataArray) {
              const content = item.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                result += content;
                if (outputElement) {
                  outputElement.textContent += content;
                  outputElement.scrollTop = outputElement.scrollHeight;
                }
              }
            }
          } else {
              // 如果不是数组，尝试解析单个对象
              const parsedData = JSON.parse(buffer.trim());
              const content = parsedData.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                result += content;
                if (outputElement) {
                  outputElement.textContent += content;
                  outputElement.scrollTop = outputElement.scrollHeight;
                }
              }
          }
        } catch (e) {
          console.error('处理Gemini流结束时解析数据失败:', e, '剩余数据:', buffer.trim());
        }
      }
      
    } catch (e) {
      console.error('读取Gemini流失败:', e);
      throw e;
    }
    
    return result;
  }
} 