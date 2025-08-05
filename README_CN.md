# AI Studio Exporter

[English Version](README.md)

一个Chrome扩展，用于将Google AI Studio中的Gemini聊天记录导出为Markdown格式。

## 功能特性

- 在Google AI Studio的代码对话框中添加"Export"按钮
- 将对话内容解析为结构化的Markdown格式
- 自动下载生成的Markdown文件
- 支持区分用户和模型的对话内容
- 对模型的响应自动分割"think"和"answer"部分

## 安装方法

1. 克隆本仓库或下载ZIP文件
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"，选择本项目的根目录

## 使用方法

1. 打开Google AI Studio (<https://aistudio.google.com/>)
2. 在任意代码对话框中，点击"Export"按钮
3. 系统会自动下载名为`gemini-chat-history.md`的Markdown文件

## 技术实现

- 使用MutationObserver监听DOM变化，动态注入导出按钮
- 通过正则表达式解析代码对话框中的对话内容
- 将解析结果格式化为Markdown结构：
  - 一级标题为对话整体
  - 二级标题区分用户和模型
  - 三级标题区分模型的"think"和"answer"部分

## 许可证

MIT License
