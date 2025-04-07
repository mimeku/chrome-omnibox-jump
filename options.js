document.getElementById('add').addEventListener('click', handleSubmit);
document.getElementById('clear-all').addEventListener('click', clearAll);

function handleSubmit() {
    const keyword = document.getElementById('keyword').value.trim().toLowerCase();
    const url = document.getElementById('url').value.trim();

    if (!keyword || !url) {
        alert('请填写关键词和URL');
        return;
    }

    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || {};

        if (keywords[keyword]) {
            if (!confirm(`"${keyword}" 已存在，是否覆盖？`)) return;
        }

        const newKeywords = { ...keywords, [keyword]: url };
        chrome.storage.local.set({ keywords: newKeywords }, () => {
            document.getElementById('keyword').value = '';
            document.getElementById('url').value = '';
            renderList(newKeywords);
        });
    });
}

function renderList(keywords = {}) {
    const list = document.getElementById('list');
    const count = document.getElementById('count');
    const isEmpty = Object.keys(keywords).length === 0;

    list.innerHTML = isEmpty
        ? '<li class="empty-tip">暂无配置规则，请在上方添加</li>'
        : '';

    count.textContent = Object.keys(keywords).length;

    Object.entries(keywords).forEach(([key, val]) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
      <div class="keyword">${key}</div>
      <div class="url">${val}</div>
      <button class="delete-btn" data-key="${key}">删除</button>
    `;
        li.querySelector('.delete-btn').addEventListener('click', handleDelete);
        list.appendChild(li);
    });
}

function handleDelete(e) {
    const key = e.target.dataset.key;
    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || {};
        delete keywords[key];
        chrome.storage.local.set({ keywords }, () => renderList(keywords));
    });
}

function clearAll() {
    if (!confirm('确定要清空所有规则吗？')) return;
    chrome.storage.local.set({ keywords: {} }, () => renderList({}));
}

// 初始化加载
chrome.storage.local.get('keywords', (data) => {
    renderList(data.keywords || {});
});

// 绑定导入按钮点击事件
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('jsonUpload').click();
});

// 文件选择事件处理
document.getElementById('jsonUpload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const newData = JSON.parse(e.target.result);
            validateJSON(newData);

            chrome.storage.local.get('keywords', (data) => {
                const currentKeywords = data.keywords || {};
                const mergedData = mergeKeywords(currentKeywords, newData);

                chrome.storage.local.set({ keywords: mergedData }, () => {
                    showUploadStatus('✅ 导入成功！已更新/新增 ' + Object.keys(newData).length + ' 条规则', true);
                    renderList(mergedData);
                    event.target.value = ''; // 清空文件选择
                });
            });

        } catch (error) {
            showUploadStatus('❌ 文件格式错误: ' + error.message, false);
        }
    };

    reader.readAsText(file);
}

// JSON数据校验
function validateJSON(data) {
    if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('必须为 { "key": "value" } 格式的对象');
    }

    Object.entries(data).forEach(([key, value]) => {
        if (typeof value !== 'string') {
            throw new Error(`键 ${key} 的值必须为字符串`);
        }
    });
}

// 合并关键词（覆盖已存在的）
function mergeKeywords(current, newData) {
    return { ...current, ...newData };
}

// 显示上传状态
function showUploadStatus(message, isSuccess) {
    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = message;
    statusEl.style.color = isSuccess ? '#28a745' : '#dc3545';

    setTimeout(() => {
        statusEl.textContent = '';
    }, 5000);
}