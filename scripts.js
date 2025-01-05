class StartPage {
    constructor() {
        this.currentEngine = 'google';
        this.bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        this.loadWallpaper();
        this.init();
        this.preloadEngineIcons();
        this.aiChat = new AIChat();
        this.initClock();
        this.initSettings();
    }

    init() {
        this.bindEvents();
        this.renderBookmarks();
        this.setActiveEngine();
    }

    bindEvents() {
        // 搜索引擎切换
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentEngine = btn.dataset.engine;
                this.setActiveEngine();
            });
        });

        // 搜索功能
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // 添加书签
        document.getElementById('addBookmarkBtn').addEventListener('click', () => this.showAddBookmarkDialog());

        // 壁纸相关
        const wallpaperBtn = document.getElementById('wallpaperBtn');
        const wallpaperInput = document.getElementById('wallpaperInput');

        wallpaperBtn.addEventListener('click', () => {
            wallpaperInput.value = ''; // 清除之前的选择
            wallpaperInput.click();
        });

        wallpaperInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件！');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const wallpaper = event.target.result;
                    localStorage.setItem('wallpaper', wallpaper);
                    document.body.style.backgroundImage = `url(${wallpaper})`;
                } catch (error) {
                    console.error('Error setting wallpaper:', error);
                    alert('设置壁纸失败，请尝试选择较小的图片文件。');
                }
            };

            reader.onerror = () => {
                alert('读取图片文件失败，请重试。');
            };

            reader.readAsDataURL(file);
        });
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = encodeURIComponent(searchInput.value);
        const searchUrls = {
            google: `https://www.google.com/search?q=${query}`,
            bing: `https://www.bing.com/search?q=${query}`,
            baidu: `https://www.baidu.com/s?wd=${query}`
        };
        window.open(searchUrls[this.currentEngine], '_blank');
    }

    setActiveEngine() {
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.engine === this.currentEngine);
            // 当按钮激活时，增加图标亮度
            const icon = btn.querySelector('.engine-icon');
            if (icon) {
                icon.style.filter = btn.dataset.engine === this.currentEngine ? 
                    'brightness(1.2)' : 'brightness(1)';
            }
        });
    }

    loadWallpaper() {
        const wallpaper = localStorage.getItem('wallpaper');
        if (wallpaper) {
            document.body.style.backgroundImage = `url(${wallpaper})`;
        } else {
            // 设置默认壁纸
            document.body.style.backgroundImage = 'url(https://source.unsplash.com/random/1920x1080/?nature,dark)';
        }
    }

    formatUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    async addBookmark(url, title) {
        try {
            url = this.formatUrl(url);
            const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${url}`;
            const bookmark = { url, title, icon: favicon };
            this.bookmarks.push(bookmark);
            localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
            this.renderBookmarks();
        } catch (error) {
            console.error('Error adding bookmark:', error);
        }
    }

    editBookmark(index) {
        const bookmark = this.bookmarks[index];
        const newUrl = prompt('编辑网站地址：', bookmark.url);
        if (newUrl !== null) {  // 用户点击确定
            const newTitle = prompt('编辑网站名称：', bookmark.title);
            if (newTitle !== null) {  // 用户点击确定
                bookmark.url = this.formatUrl(newUrl);
                bookmark.title = newTitle;
                bookmark.icon = `https://www.google.com/s2/favicons?sz=64&domain=${bookmark.url}`;
                localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
                this.renderBookmarks();
            }
        }
    }

    deleteBookmark(index) {
        if (confirm(`确定要删除 "${this.bookmarks[index].title}" 吗？`)) {
            this.bookmarks.splice(index, 1);
            localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
            this.renderBookmarks();
        }
    }

    renderBookmarks() {
        const grid = document.getElementById('bookmarksGrid');
        grid.innerHTML = this.bookmarks.map((bookmark, index) => `
            <div class="bookmark-item" data-index="${index}">
                <a href="${bookmark.url}" target="_blank" style="text-decoration: none; color: inherit;">
                    <img class="bookmark-icon" src="${bookmark.icon}" alt="${bookmark.title}" onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA...'">
                    <div class="bookmark-title">${bookmark.title}</div>
                </a>
            </div>
        `).join('');

        // 添加右键菜单事件
        grid.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const index = parseInt(item.dataset.index);
                this.showBookmarkContextMenu(e, index);
            });
        });
    }

    showBookmarkContextMenu(event, index) {
        // 移除已存在的右键菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // 创建右键菜单
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="edit-url">修改网址</div>
            <div class="menu-item" data-action="edit-title">修改名称</div>
            <div class="menu-item" data-action="edit-icon">自定义图标</div>
            <div class="menu-item delete" data-action="delete">删除书签</div>
        `;

        // 设置菜单位置
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        document.body.appendChild(menu);

        // 添加菜单项点击事件
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                switch (action) {
                    case 'edit-url':
                        this.editBookmarkUrl(index);
                        break;
                    case 'edit-title':
                        this.editBookmarkTitle(index);
                        break;
                    case 'edit-icon':
                        this.editBookmarkIcon(index);
                        break;
                    case 'delete':
                        this.deleteBookmark(index);
                        break;
                }
                menu.remove();
            });
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', () => menu.remove(), { once: true });
    }

    editBookmarkUrl(index) {
        const bookmark = this.bookmarks[index];
        const newUrl = prompt('修改网址：', bookmark.url);
        if (newUrl !== null) {
            bookmark.url = this.formatUrl(newUrl);
            bookmark.icon = `https://www.google.com/s2/favicons?sz=64&domain=${bookmark.url}`;
            this.saveAndRenderBookmarks();
        }
    }

    editBookmarkTitle(index) {
        const bookmark = this.bookmarks[index];
        const newTitle = prompt('修改名称：', bookmark.title);
        if (newTitle !== null) {
            bookmark.title = newTitle;
            this.saveAndRenderBookmarks();
        }
    }

    editBookmarkIcon(index) {
        const bookmark = this.bookmarks[index];
        const newIcon = prompt('输入图标URL：', bookmark.icon);
        if (newIcon !== null) {
            bookmark.icon = newIcon;
            this.saveAndRenderBookmarks();
        }
    }

    saveAndRenderBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
        this.renderBookmarks();
    }

    showAddBookmarkDialog() {
        const url = prompt('请输入网站地址：');
        if (url) {
            const title = prompt('请输入网站名称：');
            if (title) {
                this.addBookmark(url, title);
            }
        }
    }

    preloadEngineIcons() {
        // 预加载搜索引擎图标
        const engines = {
            google: 'https://www.google.com/favicon.ico',
            bing: 'https://www.bing.com/favicon.ico',
            baidu: 'https://www.baidu.com/favicon.ico'
        };

        Object.values(engines).forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    initClock() {
        const updateClock = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('zh-CN');
            const date = now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            
            document.querySelector('.time').textContent = time;
            document.querySelector('.date').textContent = date;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    initSettings() {
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsContent = document.querySelector('.settings-content');
        const bgOpacity = document.getElementById('bgOpacity');
        const blurAmount = document.getElementById('blurAmount');

        // 从 localStorage 加载设置
        const savedOpacity = localStorage.getItem('bgOpacity') || 40;
        const savedBlur = localStorage.getItem('blurAmount') || 5;

        bgOpacity.value = savedOpacity;
        blurAmount.value = savedBlur;

        // 应用保存的设置
        this.updateStyles(savedOpacity, savedBlur);

        settingsToggle.addEventListener('click', () => {
            settingsContent.style.display = 
                settingsContent.style.display === 'none' ? 'block' : 'none';
        });

        bgOpacity.addEventListener('input', () => {
            const opacity = bgOpacity.value;
            localStorage.setItem('bgOpacity', opacity);
            this.updateStyles(opacity, blurAmount.value);
        });

        blurAmount.addEventListener('input', () => {
            const blur = blurAmount.value;
            localStorage.setItem('blurAmount', blur);
            this.updateStyles(bgOpacity.value, blur);
        });

        // 点击其他地方关闭设置面板
        document.addEventListener('click', (e) => {
            const settingsPanel = document.querySelector('.settings-content');
            const settingsToggle = document.getElementById('settingsToggle');
            
            if (settingsPanel.style.display === 'block' && 
                !settingsPanel.contains(e.target) && 
                e.target !== settingsToggle) {
                settingsPanel.style.display = 'none';
            }
        });

        // 阻止设置面板内部点击事件冒泡
        document.querySelector('.settings-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    updateStyles(opacity, blur) {
        const elements = document.querySelectorAll('.search-container, .bookmarks-container, .clock');
        elements.forEach(el => {
            el.style.backgroundColor = `rgba(0, 0, 0, ${opacity / 100})`;
            el.style.backdropFilter = `blur(${blur}px)`;
            el.style.webkitBackdropFilter = `blur(${blur}px)`;
        });

        // 更新显示的值
        const opacityDisplay = document.querySelector('#bgOpacity + .value-display');
        const blurDisplay = document.querySelector('#blurAmount + .value-display');
        if (opacityDisplay) opacityDisplay.textContent = opacity + '%';
        if (blurDisplay) blurDisplay.textContent = blur + 'px';
    }
}

class AIChat {
    constructor() {
        this.apiKey = localStorage.getItem('aiApiKey') || '';
        this.apiEndpoint = localStorage.getItem('aiApiEndpoint') || '';
        this.modelType = localStorage.getItem('aiModelType') || 'openai-35';
        this.modelConfigs = {
            'openai-35': {
                name: 'GPT-3.5',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo'
            },
            'openai-4': {
                name: 'GPT-4',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-4'
            },
            'claude-3': {
                name: 'Claude 3',
                endpoint: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-opus-20240229'
            },
            'gemini-pro': {
                name: 'Gemini Pro',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                model: 'gemini-pro'
            },
            'qianwen': {
                name: '通义千问',
                endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                model: 'qwen-turbo'
            },
            'ernie': {
                name: '文心一言',
                endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                model: 'ernie-bot-4'
            },
            'sparkdesk': {
                name: '讯飞星火',
                endpoint: 'https://spark-api.xf-yun.com/v3.1/chat',
                model: 'spark-desk-v3'
            }
        };
        this.bindEvents();
    }

    bindEvents() {
        const chatPanel = document.querySelector('.chat-panel');
        const settingsBtn = document.getElementById('settingsBtn');
        const sendBtn = document.getElementById('sendBtn');
        const userInput = document.getElementById('userInput');

        settingsBtn.addEventListener('click', () => {
            document.querySelector('.model-settings-panel').style.display = 'block';
        });

        document.querySelector('.close-settings').addEventListener('click', () => {
            document.querySelector('.model-settings-panel').style.display = 'none';
        });

        document.querySelectorAll('.model-item').forEach(item => {
            item.addEventListener('click', () => this.selectModel(item.dataset.model));
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async selectModel(modelType) {
        this.modelType = modelType;
        if (modelType === 'custom') {
            const endpoint = prompt('请输入自定义API接口地址：', this.apiEndpoint);
            if (endpoint === null) return;
            this.apiEndpoint = endpoint;
        } else {
            const config = this.modelConfigs[modelType];
            this.apiEndpoint = config.endpoint;
        }

        const key = prompt('请输入API密钥：', this.apiKey);
        if (key !== null) {
            this.apiKey = key;
            localStorage.setItem('aiModelType', modelType);
            localStorage.setItem('aiApiEndpoint', this.apiEndpoint);
            localStorage.setItem('aiApiKey', key);
            alert(`已选择 ${this.modelConfigs[modelType]?.name || '自定义模型'}`);
            document.querySelector('.model-settings-panel').style.display = 'none';
        }
    }

    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        
        if (!message) return;
        if (!this.apiKey || !this.apiEndpoint) {
            alert('请先设置API接口地址和密钥');
            this.showSettings();
            return;
        }

        this.addMessage(message, 'user');
        userInput.value = '';

        try {
            let response;
            const config = this.modelConfigs[this.modelType];
            if (config) {
                switch (this.modelType) {
                    case 'openai-35':
                    case 'openai-4':
                        response = await this.sendToOpenAI(message, config.model);
                        break;
                    case 'claude-3':
                        response = await this.sendToClaude(message);
                        break;
                    case 'gemini-pro':
                        response = await this.sendToGemini(message);
                        break;
                    case 'qianwen':
                        response = await this.sendToQianwen(message);
                        break;
                    case 'ernie':
                        response = await this.sendToErnie(message);
                        break;
                    case 'sparkdesk':
                        response = await this.sendToSparkdesk(message);
                        break;
                }
            } else {
                response = await this.sendToCustomAPI(message);
            }
            this.addMessage(response, 'ai');
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('抱歉，发生错误：' + error.message, 'ai');
        }
    }

    async sendToOpenAI(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    }

    async sendToClaude(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                messages: [{ role: 'user', content: message }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.content[0].text;
    }

    async sendToCustomAPI(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    }

    async sendToGemini(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    }

    async sendToQianwen(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.modelConfigs.qianwen.model,
                input: {
                    messages: [{ role: 'user', content: message }]
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.output.text;
    }

    async sendToErnie(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }]
            })
        });

        const data = await response.json();
        if (data.error_code) throw new Error(data.error_msg);
        return data.result;
    }

    async sendToSparkdesk(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                header: {
                    app_id: this.appId
                },
                parameter: {
                    chat: {
                        domain: "general",
                        temperature: 0.7,
                        max_tokens: 2048
                    }
                },
                payload: {
                    message: {
                        text: [{ role: 'user', content: message }]
                    }
                }
            })
        });

        const data = await response.json();
        if (data.header.code !== 0) throw new Error(data.header.message);
        return data.payload.choices.text[0].content;
    }

    addMessage(content, type) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// 初始化应用
const startPage = new StartPage(); 