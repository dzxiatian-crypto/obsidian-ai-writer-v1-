import { Editor, Notice, Plugin, Setting } from 'obsidian';

export default class AIWriterPlugin extends Plugin {
  apiKey: string = '';
  apiUrl: string = 'http://127.0.0.1:8000';

  async onload() {
    // 加载保存的设置
    this.apiKey = await this.loadData('apiKey') || '';
    this.apiUrl = await this.loadData('apiUrl') || 'http://127.0.0.1:8000';

    // 注册命令：AI 续写
    this.addCommand({
      id: 'ai-continue-writing',
      name: 'AI Continue Writing',
      editorCallback: (editor: Editor) => {
        this.aiContinue(editor);
      }
    });

    // 注册命令：AI 润色
    this.addCommand({
      id: 'ai-polish-writing',
      name: 'AI Polish Writing',
      editorCallback: (editor: Editor) => {
        this.aiPolish(editor);
      }
    });

    // 注册命令：AI 总结
    this.addCommand({
      id: 'ai-summarize',
      name: 'AI Summarize',
      editorCallback: (editor: Editor) => {
        this.aiSummarize(editor);
      }
    });

    // 添加设置选项
    this.addSettingTab(new AISettingTab(this.app, this));

    console.log('AI Writer plugin loaded!');
  }

  async aiContinue(editor: Editor) {
    const selection = editor.getSelection();
    if (!selection) {
      new Notice('请先选中一段文字');
      return;
    }

    new Notice('AI 正在续写...');
    
    const result = await this.callAI(`请续写以下内容：${selection}`);
    
    editor.replaceSelection(selection + '\n\n' + result);
    new Notice('续写完成！');
  }

  async aiPolish(editor: Editor) {
    const selection = editor.getSelection();
    if (!selection) {
      new Notice('请先选中一段文字');
      return;
    }

    new Notice('AI 正在润色...');
    
    const result = await this.callAI(`请润色以下内容：${selection}`);
    
    editor.replaceSelection(result);
    new Notice('润色完成！');
  }

  async aiSummarize(editor: Editor) {
    const selection = editor.getSelection();
    if (!selection) {
      new Notice('请先选中一段文字');
      return;
    }

    new Notice('AI 正在总结...');
    
    const result = await this.callAI(`请用100字总结以下内容：${selection}`);
    
    editor.replaceSelection('\n\n---AI 总结---\n' + result);
    new Notice('总结完成！');
  }

  async callAI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'Qwen2.5-0.5B-Instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'AI 响应失败';
    } catch (e) {
      return '连接失败，请检查 API 设置';
    }
  }

  onunload() {
    console.log('AI Writer plugin unloaded');
  }
}

// 设置面板
class AISettingTab {
  constructor(app: any, plugin: AIWriterPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'AI Writer 设置' });
    
    // API 地址
    new Setting(containerEl)
      .setName('API 地址')
      .setDesc('oMLX API 地址')
      .addText(text => text
        .setValue(this.plugin.apiUrl)
        .onChange(async (value) => {
          this.plugin.apiUrl = value;
          await this.plugin.saveData('apiUrl', value);
        }));

    // API Key
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('oMLX API Key')
      .addText(text => text
        .setValue(this.plugin.apiKey)
        .onChange(async (value) => {
          this.plugin.apiKey = value;
          await this.plugin.saveData('apiKey', value);
        }));
        
    containerEl.createEl('p', { text: '设置后即可使用 AI 功能' });
  }
}
