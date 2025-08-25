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
        const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="margin-right: 6px;">
                           <path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m2.59-11.41L16 10l-4 4l-4-4l1.41-1.41L11 10.17V6h2v4.17zM17 17H7v-2h10z"/>
                         </svg>`;
        exportButton.innerHTML = `<span class="mdc-button__label" style="display: flex; align-items: center;">
                                      ${iconSVG}
                                      <div class="ng-star-inserted">Export</div>
                                    </span>`;

        exportButton.addEventListener('click', async () => {
            console.log('Export button clicked!');
            const codeArea = document.querySelector(SELECTORS.CODE_AREA);
            if (codeArea) {
                const codeString = codeArea.innerText;
                const parsedDialogues = parseCode(codeString);
                console.log('Parsed dialogues:', parsedDialogues);
                try {
                    const markdown = await formatToMarkdown(parsedDialogues);
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
                } catch (error) {
                    console.error('Error generating markdown:', error);
                    alert('Error generating export file. Please check the console for details.');
                }
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

    // 改进的解析策略：分层解析
    // 第一步：找到所有 types.Content 块的起始位置
    const contentStartRegex = /types\.Content\s*\(/g;
    const contentBlocks = [];

    let match;
    while ((match = contentStartRegex.exec(codeString)) !== null) {
        const startPos = match.index;

        // 使用括号计数器找到对应的结束位置
        let bracketCount = 0;
        let pos = startPos + match[0].length - 1; // 从开括号开始
        let endPos = -1;

        while (pos < codeString.length) {
            const char = codeString[pos];
            if (char === '(') {
                bracketCount++;
            } else if (char === ')') {
                bracketCount--;
                if (bracketCount === 0) {
                    endPos = pos;
                    break;
                }
            }
            pos++;
        }

        if (endPos !== -1) {
            const contentBlock = codeString.substring(startPos, endPos + 1);
            contentBlocks.push(contentBlock);
        }
    }

    // 第二步：解析每个Content块
    contentBlocks.forEach((contentBlock) => {
        // 提取role
        const roleMatch = contentBlock.match(/role\s*=\s*"([^"]+)"/);
        if (!roleMatch) {
            return;
        }

        const role = roleMatch[1];

        // 检查是否包含占位符
        if (role === 'user' && contentBlock.includes('INSERT_INPUT_HERE')) {
            return;
        }

        // 找到parts数组的边界
        const partsStartMatch = contentBlock.match(/parts\s*=\s*\[/);
        if (!partsStartMatch) {
            return;
        }

        const partsStartPos = contentBlock.indexOf(partsStartMatch[0]) + partsStartMatch[0].length;

        // 使用括号计数器找到parts数组的结束位置
        let squareBracketCount = 1; // 已经遇到了开始的 [
        let pos = partsStartPos;
        let partsEndPos = -1;

        while (pos < contentBlock.length && squareBracketCount > 0) {
            const char = contentBlock[pos];
            if (char === '[') {
                squareBracketCount++;
            } else if (char === ']') {
                squareBracketCount--;
                if (squareBracketCount === 0) {
                    partsEndPos = pos;
                    break;
                }
            }
            pos++;
        }

        if (partsEndPos === -1) {
            return;
        }

        const partsContent = contentBlock.substring(partsStartPos, partsEndPos);

        // 第三步：解析parts数组中的所有文本内容
        const texts = [];

        // 查找所有 types.Part.from_text 调用
        const partRegex = /types\.Part\.from_text\s*\(\s*text\s*=\s*"""([\s\S]*?)"""\s*\)/g;

        let textMatch;
        while ((textMatch = partRegex.exec(partsContent)) !== null) {
            const rawText = textMatch[1] || "";
            const text = rawText.replace(/\\"/g, '"').trim();
            texts.push(text);
        }

        if (texts.length > 0) {
            dialogues.push({ role, texts });
        }
    });

    return dialogues;
}


async function formatToMarkdown(dialogues) {
    // 读取用户设置
    const settings = await new Promise((resolve) => {
        chrome.storage.sync.get({
            includeThink: true,
            collapseThink: true
        }, resolve);
    });

    let markdownContent = '# Gemini Chat History\n\n'; // 添加一级标题

    dialogues.forEach((dialogue, index) => {
        // 为不同角色添加emoji标签
        let roleHeader;
        if (dialogue.role === 'user') {
            roleHeader = '🧑‍💻 User';
        } else if (dialogue.role === 'model') {
            roleHeader = '🤖 Model';
        } else {
            roleHeader = dialogue.role.charAt(0).toUpperCase() + dialogue.role.slice(1);
        }

        markdownContent += `## ${roleHeader}\n\n`; // 将角色标记改为二级标题

        if (dialogue.role === 'model' && dialogue.texts.length === 2) {
            // 如果是模型且有两部分
            if (settings.includeThink) {
                if (settings.collapseThink) {
                    // 折叠 think 部分
                    markdownContent += `<div style="border: 2px solid #dddddd; border-radius: 10px;">\n  <details style="padding: 5px;">\n    <summary>Thinging...</summary>\n    ${dialogue.texts[0].trim()}\n  </details>\n</div>\n\n`;
                    // 不再需要 answer header
                    markdownContent += `${dialogue.texts[1].trim()}\n\n`;
                } else {
                    // 不折叠 think 部分
                    markdownContent += `### think\n\n${dialogue.texts[0].trim()}\n\n`;
                    markdownContent += `### answer\n\n${dialogue.texts[1].trim()}\n\n`;
                }
            } else {
                // 不包含 think 部分，只显示 answer
                markdownContent += `${dialogue.texts[1].trim()}\n\n`;
            }
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