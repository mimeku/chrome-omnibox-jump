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