/**
 * 设置管理器 - 处理API配置的保存和加载
 */
export class SettingsManager {
  constructor() {
    // 先定义默认设置，确保在调用loadSettings时defaultSettings已存在
    this.defaultSettings = {
      models: {
        tongyi: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          model: 'qwen-plus'
        },
        deepseek: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://api.deepseek.com/v1',
          models: {
            V3: 'deepseek-chat',
            R1: 'deepseek-reasoner'
          }
        },
        openai: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-3.5-turbo'
        },
        gemini: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
          model: 'gemini-pro'
        },
        custom: {
          enabled: false,
          apiKey: '',
          baseUrl: '',
          model: ''
        }
      },
      systemMessage: {
        role: 'system',
        content: '你是一个专业的文字编辑，熟知中国的出版规范，精通编校质量标准。同时，对于任何请求，你都会直接给出结果，不会做过多的解释。'
      },
      defaultModel: 'tongyi'
    };
    
    // 然后加载设置
    this.settings = this.loadSettings();
  }

  /**
   * 加载设置
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('prose-polish-settings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
    return this.getDefaultSettings();
  }

  /**
   * 获取默认设置
   */
  getDefaultSettings() {
    try {
      if (!this.defaultSettings) {
        console.warn('默认设置未定义，使用内置默认值');
        return {
          models: {
            tongyi: { enabled: false, apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus' },
            deepseek: { enabled: false, apiKey: '', baseUrl: 'https://api.deepseek.com/v1', models: { V3: 'deepseek-chat', R1: 'deepseek-reasoner' } },
            openai: { enabled: false, apiKey: '', baseUrl: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo' },
            gemini: { enabled: false, apiKey: '', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models', model: 'gemini-pro' },
            custom: { enabled: false, apiKey: '', baseUrl: '', model: '' }
          },
          systemMessage: { role: 'system', content: '你是一个专业的文字编辑，熟知中国的出版规范，精通编校质量标准。同时，对于任何请求，你都会直接给出结果，不会做过多的解释。' },
          defaultModel: 'tongyi'
        };
      }
      return JSON.parse(JSON.stringify(this.defaultSettings));
    } catch (error) {
      console.error('获取默认设置失败:', error);
      // 返回最基本的设置以防止继续出错
      return {
        models: { custom: { enabled: false, apiKey: '', baseUrl: '', model: '' } },
        systemMessage: { role: 'system', content: '' },
        defaultModel: 'custom'
      };
    }
  }

  /**
   * 保存设置
   */
  saveSettings(settings) {
    try {
      this.settings = settings || this.settings;
      localStorage.setItem('prose-polish-settings', JSON.stringify(this.settings));
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  /**
   * 获取当前设置
   */
  getSettings() {
    const freshSettings = this.loadSettings();
    this.settings = freshSettings; 
    return freshSettings;
  }

  /**
   * 更新特定设置
   * @param {string} path - 设置路径，例如 "models.openai.apiKey"
   * @param {any} value - 新值
   */
  updateSetting(path, value) {
    const parts = path.split('.');
    let current = this.settings;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    this.saveSettings();
    return true;
  }

  /**
   * 获取特定设置
   * @param {string} path - 设置路径，例如 "models.openai.apiKey"
   * @param {any} defaultValue - 如果设置不存在，返回的默认值
   */
  getSetting(path, defaultValue = null) {
    const parts = path.split('.');
    let current = this.settings;
    
    for (const part of parts) {
      if (current === undefined || current === null || !current.hasOwnProperty(part)) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * 重置所有设置到默认值
   */
  resetSettings() {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    return true;
  }
} 