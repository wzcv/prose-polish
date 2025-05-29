/**
 * 设置对话框 - 用于管理API配置
 */
import { showAlert, showConfirm } from './customDialogs.js';
import { SettingsManager } from './settingsManager.js';
// 确保 ApiService 被导入，如果它在不同的文件中
// import { ApiService } from './apiService.js'; 

export class SettingsDialog {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.dialog = null;
    this.currentTab = 'general';
  }

  /**
   * 显示设置对话框
   */
  show() {
    // 如果对话框已存在，则先移除
    if (this.dialog) {
      this.dialog.remove();
    }

    // 创建对话框
    this.dialog = document.createElement('div');
    this.dialog.className = 'settings-dialog';
    this.dialog.innerHTML = this.createDialogHTML();
    document.body.appendChild(this.dialog);

    // 绑定事件
    this.bindEvents();

    // 加载当前设置
    this.loadCurrentSettings();
  }

  /**
   * 创建对话框HTML
   */
  createDialogHTML() {
    return `
      <div class="settings-content">
        <div class="settings-header">
          <h2>设置</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="settings-tabs">
          <div class="tab-item active" data-tab="general">通用设置</div>
          <div class="tab-item" data-tab="models">模型配置</div>
          <div class="tab-item" data-tab="about">关于</div>
        </div>
        <div class="settings-body">
          ${this.createGeneralTabHTML()}
          ${this.createModelsTabHTML()}
          ${this.createAboutTabHTML()}
        </div>
        <div class="settings-footer">
          <button class="reset-btn">重置设置</button>
          <button class="save-btn">保存</button>
        </div>
      </div>
    `;
  }

  /**
   * 创建通用设置标签页
   */
  createGeneralTabHTML() {
    return `
      <div class="tab-content active" id="general-tab">
        <div class="form-group">
          <label for="default-model">默认模型</label>
          <select id="default-model">
            <option value="tongyi">通义千问</option>
            <option value="deepseek-v3">DeepSeek-V3</option>
            <option value="deepseek-r1">DeepSeek-R1</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
            <option value="custom">自定义模型</option>
          </select>
        </div>
        <div class="form-group">
          <label for="system-message">系统提示词</label>
          <textarea id="system-message" rows="5" placeholder="设置AI助手的系统提示词"></textarea>
          <div class="hint">这将作为AI的基础设定，影响其回复风格和专业方向</div>
        </div>
      </div>
    `;
  }

  /**
   * 创建模型配置标签页
   */
  createModelsTabHTML() {
    return `
      <div class="tab-content" id="models-tab">
        <div class="model-tabs">
          <div class="model-tab-item active" data-model="tongyi">通义千问</div>
          <div class="model-tab-item" data-model="deepseek">DeepSeek</div>
          <div class="model-tab-item" data-model="openai">OpenAI</div>
          <div class="model-tab-item" data-model="gemini">Google Gemini</div>
          <div class="model-tab-item" data-model="custom">自定义模型</div>
        </div>
        
        <div class="model-content active" id="tongyi-content">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="tongyi-enabled">
              <span class="slider"></span>
            </label>
            <label for="tongyi-enabled">启用通义千问</label>
          </div>
          <div class="form-group">
            <label for="tongyi-api-key">API Key</label>
            <input type="password" id="tongyi-api-key" placeholder="输入通义千问API Key">
            <div class="hint">获取方式：访问 <a href="https://dashscope.aliyun.com/" target="_blank">https://dashscope.aliyun.com/</a></div>
          </div>
          <div class="form-group">
            <label for="tongyi-base-url">API基础URL</label>
            <input type="text" id="tongyi-base-url" placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions">
            <div class="hint">如果使用代理或自定义端点，可以修改此URL</div>
          </div>
          <div class="form-group">
            <label for="tongyi-model">模型</label>
            <input type="text" id="tongyi-model" placeholder="例如：qwen-plus">
            <div class="hint">默认支持：qwen-plus、qwen-turbo、qwen-max 等</div>
          </div>
        </div>
        
        <div class="model-content" id="deepseek-content">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="deepseek-enabled">
              <span class="slider"></span>
            </label>
            <label for="deepseek-enabled">启用DeepSeek</label>
          </div>
          <div class="form-group">
            <label for="deepseek-api-key">API Key</label>
            <input type="password" id="deepseek-api-key" placeholder="输入DeepSeek API Key">
            <div class="hint">获取方式：访问 <a href="https://platform.deepseek.com" target="_blank">https://platform.deepseek.com</a></div>
          </div>
          <div class="form-group">
            <label for="deepseek-base-url">API基础URL</label>
            <input type="text" id="deepseek-base-url" placeholder="https://api.deepseek.com/v1">
            <div class="hint">如果使用代理或自定义端点，可以修改此URL</div>
          </div>
          <div class="form-group">
            <label for="deepseek-v3-model">V3模型名称</label>
            <input type="text" id="deepseek-v3-model" placeholder="例如：deepseek-chat">
            <div class="hint">指定DeepSeek V3使用的模型名称</div>
          </div>
          <div class="form-group">
            <label for="deepseek-r1-model">R1模型名称</label>
            <input type="text" id="deepseek-r1-model" placeholder="例如：deepseek-reasoner">
            <div class="hint">指定DeepSeek R1使用的模型名称</div>
          </div>
        </div>
        
        <div class="model-content" id="openai-content">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="openai-enabled">
              <span class="slider"></span>
            </label>
            <label for="openai-enabled">启用OpenAI</label>
          </div>
          <div class="form-group">
            <label for="openai-api-key">API Key</label>
            <input type="password" id="openai-api-key" placeholder="输入OpenAI API Key">
            <div class="hint">获取方式：访问 <a href="https://platform.openai.com/api-keys" target="_blank">https://platform.openai.com/api-keys</a></div>
          </div>
          <div class="form-group">
            <label for="openai-base-url">API基础URL</label>
            <input type="text" id="openai-base-url" placeholder="https://api.openai.com/v1/chat/completions">
            <div class="hint">如果使用代理或自定义端点，可以修改此URL</div>
          </div>
          <div class="form-group">
            <label for="openai-model">模型</label>
            <input type="text" id="openai-model" placeholder="例如：gpt-3.5-turbo">
            <div class="hint">默认支持：gpt-3.5-turbo、gpt-4、gpt-4-turbo 等</div>
          </div>
        </div>
        
        <div class="model-content" id="gemini-content">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="gemini-enabled">
              <span class="slider"></span>
            </label>
            <label for="gemini-enabled">启用Google Gemini</label>
          </div>
          <div class="form-group">
            <label for="gemini-api-key">API Key</label>
            <input type="password" id="gemini-api-key" placeholder="输入Google Gemini API Key">
            <div class="hint">获取方式：访问 <a href="https://aistudio.google.com/app/apikey" target="_blank">https://aistudio.google.com/app/apikey</a></div>
          </div>
          <div class="form-group">
            <label for="gemini-base-url">API基础URL</label>
            <input type="text" id="gemini-base-url" placeholder="https://generativelanguage.googleapis.com/v1beta/models">
            <div class="hint">如果使用代理或自定义端点，可以修改此URL</div>
          </div>
          <div class="form-group">
            <label for="gemini-model">模型</label>
            <input type="text" id="gemini-model" placeholder="例如：gemini-pro">
            <div class="hint">默认支持：gemini-pro、gemini-1.5-pro 等</div>
          </div>
        </div>
        
        <div class="model-content" id="custom-content">
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="custom-enabled">
              <span class="slider"></span>
            </label>
            <label for="custom-enabled">启用自定义模型</label>
          </div>
          <div class="form-group">
            <label for="custom-base-url">API基础URL</label>
            <input type="text" id="custom-base-url" placeholder="例如：https://api.openai.com/v1/chat/completions">
            <div class="hint">API服务器的基础URL</div>
          </div>
          <div class="form-group">
            <label for="custom-api-key">API Key</label>
            <input type="password" id="custom-api-key" placeholder="输入API Key">
            <div class="hint">用于认证的API密钥</div>
          </div>
          <div class="form-group">
            <label for="custom-model">模型名称</label>
            <input type="text" id="custom-model" placeholder="例如：gpt-3.5-turbo">
            <div class="hint">要使用的模型标识符</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 创建关于标签页
   */
  createAboutTabHTML() {
    return `
      <div class="tab-content" id="about-tab">
        <div class="about-content">
          <h3>卡片式改稿助手</h3>
          <p>版本: 2.0.0</p>
          <p>这是一个专注于文案、稿件编辑的AI交互工具。</p>
          <p>通过拖拽卡片的方式与AI交互，可以识别Markdown格式的文稿，将其自动打断成段落卡片。</p>
          <p>此版本为纯前端版本，可直接部署在Vercel、Netlify等静态托管平台上。</p>
          <p>使用规则：<strong>插头插在插座上！</strong></p>
          <div class="github-link">
            <a href="https://github.com/wzcv/prose-polish" target="_blank">GitHub项目地址</a>
          </div>
          <p><a href="https://github.com/ErSanSan233/prose-polish" target="_blank">原项目地址</a></p>
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮
    this.dialog.querySelector('.close-btn').addEventListener('click', () => {
      this.dialog.remove();
    });

    // 标签页切换
    this.dialog.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // 模型标签页切换
    this.dialog.querySelectorAll('.model-tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchModelTab(tab.dataset.model);
      });
    });

    // 保存按钮
    this.dialog.querySelector('.save-btn').addEventListener('click', () => {
      this.saveSettings();
    });

    // 重置按钮
    this.dialog.querySelector('.reset-btn').addEventListener('click', () => {
      showConfirm('确定要重置所有设置吗？这将清除所有已保存的API密钥和配置。').then(confirmed => {
        if (confirmed) {
          this.settingsManager.resetSettings();
          this.loadCurrentSettings();
          showAlert('设置已重置为默认值');
        }
      });
    });
  }

  /**
   * 切换标签页
   */
  switchTab(tabId) {
    this.currentTab = tabId;
    
    // 更新标签页按钮状态
    this.dialog.querySelectorAll('.tab-item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // 更新标签页内容
    this.dialog.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
  }

  /**
   * 切换模型标签页
   */
  switchModelTab(modelId) {
    // 更新模型标签页按钮状态
    this.dialog.querySelectorAll('.model-tab-item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.model === modelId);
    });
    
    // 更新模型标签页内容
    this.dialog.querySelectorAll('.model-content').forEach(content => {
      content.classList.toggle('active', content.id === `${modelId}-content`);
    });
  }

  /**
   * 加载当前设置
   */
  loadCurrentSettings() {
    const settings = this.settingsManager.getSettings();
    
    // 通用设置
    this.dialog.querySelector('#default-model').value = settings.defaultModel || 'tongyi';
    this.dialog.querySelector('#system-message').value = settings.systemMessage?.content || '';
    
    // 通义千问设置
    this.dialog.querySelector('#tongyi-enabled').checked = settings.models?.tongyi?.enabled || false;
    this.dialog.querySelector('#tongyi-api-key').value = settings.models?.tongyi?.apiKey || '';
    this.dialog.querySelector('#tongyi-base-url').value = settings.models?.tongyi?.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    this.dialog.querySelector('#tongyi-model').value = settings.models?.tongyi?.model || 'qwen-plus';
    
    // DeepSeek设置
    this.dialog.querySelector('#deepseek-enabled').checked = settings.models?.deepseek?.enabled || false;
    this.dialog.querySelector('#deepseek-api-key').value = settings.models?.deepseek?.apiKey || '';
    this.dialog.querySelector('#deepseek-base-url').value = settings.models?.deepseek?.baseUrl || 'https://api.deepseek.com/v1';
    this.dialog.querySelector('#deepseek-v3-model').value = settings.models?.deepseek?.models?.V3 || 'deepseek-chat';
    this.dialog.querySelector('#deepseek-r1-model').value = settings.models?.deepseek?.models?.R1 || 'deepseek-reasoner';
    
    // OpenAI设置
    this.dialog.querySelector('#openai-enabled').checked = settings.models?.openai?.enabled || false;
    this.dialog.querySelector('#openai-api-key').value = settings.models?.openai?.apiKey || '';
    this.dialog.querySelector('#openai-base-url').value = settings.models?.openai?.baseUrl || 'https://api.openai.com/v1/chat/completions';
    this.dialog.querySelector('#openai-model').value = settings.models?.openai?.model || 'gpt-3.5-turbo';
    
    // Gemini设置
    this.dialog.querySelector('#gemini-enabled').checked = settings.models?.gemini?.enabled || false;
    this.dialog.querySelector('#gemini-api-key').value = settings.models?.gemini?.apiKey || '';
    this.dialog.querySelector('#gemini-base-url').value = settings.models?.gemini?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.dialog.querySelector('#gemini-model').value = settings.models?.gemini?.model || 'gemini-pro';
    
    // 自定义模型设置
    this.dialog.querySelector('#custom-enabled').checked = settings.models?.custom?.enabled || false;
    this.dialog.querySelector('#custom-base-url').value = settings.models?.custom?.baseUrl || '';
    this.dialog.querySelector('#custom-api-key').value = settings.models?.custom?.apiKey || '';
    this.dialog.querySelector('#custom-model').value = settings.models?.custom?.model || '';
  }

  /**
   * 保存设置
   */
  saveSettings() {
    const settings = this.settingsManager.getSettings();
    
    // 通用设置
    settings.defaultModel = this.dialog.querySelector('#default-model').value;
    settings.systemMessage = {
      role: 'system',
      content: this.dialog.querySelector('#system-message').value
    };
    
    // 通义千问设置
    settings.models.tongyi = {
      enabled: this.dialog.querySelector('#tongyi-enabled').checked,
      apiKey: this.dialog.querySelector('#tongyi-api-key').value,
      baseUrl: this.dialog.querySelector('#tongyi-base-url').value,
      model: this.dialog.querySelector('#tongyi-model').value
    };
    
    // DeepSeek设置
    settings.models.deepseek = {
      enabled: this.dialog.querySelector('#deepseek-enabled').checked,
      apiKey: this.dialog.querySelector('#deepseek-api-key').value,
      baseUrl: this.dialog.querySelector('#deepseek-base-url').value,
      models: {
        V3: this.dialog.querySelector('#deepseek-v3-model').value,
        R1: this.dialog.querySelector('#deepseek-r1-model').value
      }
    };
    
    // OpenAI设置
    settings.models.openai = {
      enabled: this.dialog.querySelector('#openai-enabled').checked,
      apiKey: this.dialog.querySelector('#openai-api-key').value,
      baseUrl: this.dialog.querySelector('#openai-base-url').value,
      model: this.dialog.querySelector('#openai-model').value
    };
    
    // Gemini设置
    settings.models.gemini = {
      enabled: this.dialog.querySelector('#gemini-enabled').checked,
      apiKey: this.dialog.querySelector('#gemini-api-key').value,
      baseUrl: this.dialog.querySelector('#gemini-base-url').value,
      model: this.dialog.querySelector('#gemini-model').value
    };
    
    // 自定义模型设置
    settings.models.custom = {
      enabled: this.dialog.querySelector('#custom-enabled').checked,
      apiKey: this.dialog.querySelector('#custom-api-key').value,
      baseUrl: this.dialog.querySelector('#custom-base-url').value,
      model: this.dialog.querySelector('#custom-model').value
    };
    
    // 保存设置
    if (this.settingsManager.saveSettings(settings)) {
      showAlert('设置已保存').then(() => {
        this.dialog.remove();
        // 通知设置已更改
        window.dispatchEvent(new CustomEvent('settingsChanged'));
        
        // 强制 ApiService 重新加载设置
        if (window.apiService && typeof window.apiService.reloadSettings === 'function') {
          window.apiService.reloadSettings();
        }
      });
    } else {
      showAlert('保存设置失败');
    }
  }
} 