// options.js - AI Studio Exporter 设置页面逻辑

// 默认设置
const DEFAULT_SETTINGS = {
    includeThink: true,
    collapseThink: true
};

// 初始化页面
document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    const includeThinkCheckbox = document.getElementById('includeThink');
    const collapseThinkCheckbox = document.getElementById('collapseThink');

    // 包含 think 部分的复选框变化
    includeThinkCheckbox.addEventListener('change', function () {
        // 如果取消包含 think，则自动取消折叠 think
        if (!this.checked) {
            collapseThinkCheckbox.checked = false;
        }
        // 更新折叠 think 的可用状态
        collapseThinkCheckbox.disabled = !this.checked;
        saveSettings();
    });

    // 折叠 think 部分的复选框变化
    collapseThinkCheckbox.addEventListener('change', function () {
        saveSettings();
    });
}

// 加载设置
function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, function (settings) {
        document.getElementById('includeThink').checked = settings.includeThink;
        document.getElementById('collapseThink').checked = settings.collapseThink;

        // 根据包含 think 设置来启用/禁用折叠 think
        document.getElementById('collapseThink').disabled = !settings.includeThink;
    });
}

// 保存设置
function saveSettings() {
    const settings = {
        includeThink: document.getElementById('includeThink').checked,
        collapseThink: document.getElementById('collapseThink').checked
    };

    chrome.storage.sync.set(settings, function () {
        showStatus('设置已保存', false);

        // 3秒后隐藏状态消息
        setTimeout(() => {
            hideStatus();
        }, 3000);
    });
}

// 显示状态消息
function showStatus(message, isError = false) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.style.display = 'block';

    if (isError) {
        statusElement.classList.add('error');
    } else {
        statusElement.classList.remove('error');
    }
}

// 隐藏状态消息
function hideStatus() {
    const statusElement = document.getElementById('status');
    statusElement.style.display = 'none';
}