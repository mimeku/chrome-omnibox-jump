// 初始化存储（带空值保护和默认值）
const initializeStorage = () => {
    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || {}; // 关键修复
        // 仅初始化空存储
        if (Object.keys(keywords).length === 0) {
            const defaultKeywords = {
                doc: 'https://bytedance.larkoffice.com/drive/me/',
                help: 'https://your-domain.com/help'
            };

            chrome.storage.local.set({ keywords: defaultKeywords }, () => {
                console.log('默认关键词已设置:', defaultKeywords);
            });
        }
    });
};

// 安装监听器 ✅
chrome.runtime.onInstalled.addListener(() => {
    // console.log('插件已安装/更新');
    initializeStorage();
});

// 启动监听器 ✅
chrome.runtime.onStartup.addListener(() => {
    // console.log('浏览器已重启');
    initializeStorage();
});

// 处理地址栏输入
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    // console.log("监控地址栏输入变化");
    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || {};
        const lowerText = text.toLowerCase();
        // console.log("keywords: ", keywords);
        if (keywords[lowerText]) {
            // console.log("存在keyword", lowerText);
            suggest([{
                content: keywords[lowerText],
                description: `🚀 直达: ${keywords[lowerText]}`,
                deletable: true,
            }]);
        }
    });
});

// 处理跳转逻辑
chrome.omnibox.onInputEntered.addListener((text) => {
    // console.log("监控地址栏输入");
    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || {};
        const url = keywords[text] || text;
        // console.log("准备跳转的url: ", url);
        chrome.tabs.update({ url: formatUrl(url) });
    });
});

function formatUrl(url) {
    return url.startsWith('http') ? url : `https://${url}`;
}