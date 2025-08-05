// content.js

const SELECTORS = {
    COPY_BUTTON_CONTAINER: '#code-dialog .code-display-header .right-side .button-container', // Copy 按钮的父容器，更通用
    CODE_AREA: '#code-dialog .code-display-body code', // 代码区域的父元素
    CODE_DIALOG: '#code-dialog' // 整个弹窗
};

function injectExportButton() {
    console.log('Attempting to inject Export button...');
    const copyButtonContainer = document.querySelector(SELECTORS.COPY_BUTTON_CONTAINER);
    const codeArea = document.querySelector(SELECTORS.CODE_AREA);

    if (copyButtonContainer && codeArea) {
        // 检查是否已经注入过按钮
        if (document.getElementById('gemini-export-button')) {
            console.log('Export button already injected.');
            return;
        }

        const exportButton = document.createElement('button');
        exportButton.id = 'gemini-export-button';
        exportButton.className = 'mdc-button mdc-button--outlined mat-mdc-outlined-button mat-unthemed mat-mdc-button-base ng-star-inserted'; // 复制 Copy 按钮的部分样式
        exportButton.setAttribute('mat-button', ''); // 保持 Material Design 样式
        exportButton.setAttribute('aria-label', 'Export SDK code');
        exportButton.innerHTML = `<span class="mdc-button__label">
                                    <div class="ng-star-inserted">Export</div>
                                  </span>`;

        exportButton.addEventListener('click', () => {
            console.log('Export button clicked!');
            const codeArea = document.querySelector(SELECTORS.CODE_AREA);
            if (codeArea) {
                const codeString = codeArea.innerText;
                const parsedDialogues = parseCode(codeString);
                console.log('Parsed dialogues:', parsedDialogues);
                const markdown = formatToMarkdown(parsedDialogues);
                // 创建 Blob 对象
                const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
                // 创建下载链接
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gemini-chat-history.md';
                // 模拟点击下载
                document.body.appendChild(a); // 附加到body才能模拟点击
                a.click();
                document.body.removeChild(a); // 移除元素
                // 释放URL对象
                URL.revokeObjectURL(url);

                alert('Gemini chat history exported to gemini-chat-history.md');
            } else {
                alert('Could not find code area to extract code from.');
            }
        });

        // 将 Export 按钮添加到 Copy 按钮旁边
        // 假设 Copy 按钮是 button-container 的倒数第二个孩子
        const copyButton = copyButtonContainer.querySelector('button:nth-child(2)'); // 找到 Copy 按钮
        if (copyButton) {
            copyButtonContainer.insertBefore(exportButton, copyButton.nextSibling);
            console.log('Export button injected successfully.');
        } else {
            // 如果找不到 Copy 按钮，尝试添加到容器末尾
            copyButtonContainer.appendChild(exportButton);
            console.log('Export button injected, but Copy button not found. Appended to container.');
        }
    } else {
        console.log('Copy button container or code area not found yet.');
    }
}

// 使用 MutationObserver 监听 DOM 变化
const observer = new MutationObserver((mutationsList, observer) => {
    // 每次 DOM 变化时都尝试注入按钮
    // 检查弹窗是否存在，如果存在则尝试注入
    if (document.querySelector(SELECTORS.CODE_DIALOG)) {
        injectExportButton();
    }
});

// 开始监听整个文档的 DOM 变化
observer.observe(document.body, {
    childList: true, // 监听子节点的添加或删除
    subtree: true     // 监听所有后代节点的添加或删除
});

function parseCode(codeString) {
    const dialogues = [];
    // 正则表达式：匹配一个完整的 types.Content(...) 块
    const contentBlockRegex = /types\.Content\([\s\S]*?role="([^"]+)"[\s\S]*?parts=\[([\s\S]*?)\][\s\S]*?\)/g;

    let contentMatch;
    while ((contentMatch = contentBlockRegex.exec(codeString)) !== null) {
        const role = contentMatch[1];
        const partsContent = contentMatch[2]; // parts 数组内的所有内容

        // 如果是 'user' 角色且包含占位符，则直接跳过整个 Content 块
        if (role === 'user' && partsContent.includes('INSERT_INPUT_HERE')) {
            continue;
        }

        const texts = [];
        // 正则表达式：从 partsContent 中提取每个 from_text 的内容
        const textPartRegex = /types\.Part\.from_text\(text=(?:"((?:.|\n)*?)"|"""((?:.|\n)*?)""")\)/g;

        let textMatch;
        while ((textMatch = textPartRegex.exec(partsContent)) !== null) {
            // textMatch[1] 对应 "..." 引号的内容, textMatch[2] 对应 """...""" 引号的内容
            const rawText = textMatch[1] || textMatch[2] || "";
            // 移除开头和结尾的多余引号，处理转义引号
            const text = rawText.replace(/^"+|"+$/g, '').replace(/\\"/g, '"').trim();
            texts.push(text);
        }

        if (texts.length > 0) {
            dialogues.push({ role, texts });
        }
    }
    return dialogues;
}


function formatToMarkdown(dialogues) {
    let markdownContent = '# Gemini Chat History\n\n'; // 添加一级标题

    dialogues.forEach((dialogue, index) => {
        const roleName = dialogue.role.charAt(0).toUpperCase() + dialogue.role.slice(1);
        markdownContent += `## ${roleName}\n\n`; // 将角色标记改为二级标题

        if (dialogue.role === 'model' && dialogue.texts.length === 2) {
            // 如果是模型且有两部分，则分别用三级标题标记
            markdownContent += `### think\n${dialogue.texts[0].trim()}\n\n`;
            markdownContent += `### answer\n${dialogue.texts[1].trim()}\n\n`;
        } else {
            markdownContent += dialogue.texts.map(text => text.trim()).join('\n\n');
            markdownContent += '\n\n'; // 确保内容后有空行
        }

        // 在不同对话块之间添加分隔线，除非是最后一个对话块
        if (index < dialogues.length - 1) {
            markdownContent += '---\n\n';
        }
    });

    return markdownContent;
}

console.log('Gemini Prompt Exporter content script loaded.');